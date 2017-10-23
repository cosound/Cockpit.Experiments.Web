import knockout = require("knockout");
import ExperimentManager = require("Managers/Portal/Experiment");
import SlideModel = require("Models/Slide");
import DisposableComponent = require("Components/DisposableComponent");

class SlideShell extends DisposableComponent
{
	public Title: KnockoutObservable<string>;
	public HasTitle: KnockoutComputed<boolean>;

	public SlideData: KnockoutObservable<SlideModel> = knockout.observable<SlideModel>();

	public AreAllQuestionsAnswered:KnockoutObservable<boolean> = knockout.observable(false);
	public SlideIndex:KnockoutObservable<number>;
	public SlideNumber:KnockoutComputed<number>;
	public NumberOfSlides: KnockoutObservable<number>;

	public IsLoadingSlide: KnockoutComputed<boolean>;

	public IsPreviousSlideVisible: KnockoutComputed<boolean>;
	public IsPreviousSlideEnabled:KnockoutComputed<boolean>;
	public IsNextSlideVisible: KnockoutComputed<boolean>;
	public IsNextSlideEnabled: KnockoutComputed<boolean>;
	public IsCloseExperimentVisible: KnockoutComputed<boolean>;
	public IsCloseExperimentEnabled: KnockoutComputed<boolean>;
	public IsHighlighted: KnockoutObservable<boolean> = knockout.observable(false);
	public IsWaiting: KnockoutComputed<boolean>;
	public IsWaitingForNext: KnockoutObservable<boolean> = knockout.observable(false);

	constructor()
	{
		super();
		this.IsLoadingSlide = this.Computed(() => this.SlideData() == null);
		this.SlideIndex = ExperimentManager.CurrentSlideIndex;
		this.SlideNumber = this.Computed(() => this.SlideIndex() + 1);
		this.NumberOfSlides = ExperimentManager.NumberOfSlides;

		this.IsWaiting = this.Computed(() => this.IsWaitingForNext());

		this.IsPreviousSlideVisible = this.Computed(() => ExperimentManager.GoToPreviousSlideEnabled() && !ExperimentManager.CloseSlidesEnabled());
		this.IsPreviousSlideEnabled = this.Computed(() => this.IsPreviousSlideVisible() && !this.IsLoadingSlide() && this.SlideIndex() !== 0 && !this.IsWaiting());
		this.IsNextSlideVisible = this.Computed(() => this.SlideNumber() !== this.NumberOfSlides());
		this.IsNextSlideEnabled = this.Computed(() => this.IsNextSlideVisible() && !this.IsLoadingSlide() && !this.IsWaiting());
		this.IsCloseExperimentVisible = this.Computed(() => ExperimentManager.IsExperimentCompleted() && ExperimentManager.CloseExperimentEnabled());
		this.IsCloseExperimentEnabled = this.Computed(() => this.IsCloseExperimentVisible() && !this.IsWaiting());

		this.Title = ExperimentManager.SlideTitle;
		this.HasTitle = this.Computed(() => this.Title() !== "");

		this.Subscribe(ExperimentManager.IsReady,r =>
		{
			if (!r) return;

			this.LoadNextSlide();
		});

		this.IsHighlighted.subscribe(value =>
		{
			if (value) setTimeout(() => this.IsHighlighted(false), 3000); //TODO: add binding to listen to the event for animation complete instead of timeout
		});

		if (ExperimentManager.IsReady()) this.LoadNextSlide();
	}

	public GoToNextSlide():void
	{
		this.IsWaitingForNext(true);

		this.AddAction(() => !this.IsLoadingSlide() && !this.SlideData().IsWorking(), () =>
		{
			this.IsWaitingForNext(false);

			console.log("Goto", this.AreAllQuestionsAnswered())

			if (this.AreAllQuestionsAnswered())
			{
				this.LoadNextSlide();
			}
			else
			{
				this.SlideData().ScrollToFirstInvalidAnswer();

				if (this.IsHighlighted())
				{
					this.IsHighlighted(false);
					setTimeout(() => this.IsHighlighted(true), 50);
				}
				else
					this.IsHighlighted(true);
			}
		});
	}

	private LoadNextSlide():void
	{
		this.UnloadSlide(true);

		ExperimentManager.LoadNextSlide((index, questions) => this.SlideData(new SlideModel("Slides/Default", index, this.AreAllQuestionsAnswered, questions)));
	}

	public GoToPreviousSlide():void
	{
		this.UnloadSlide(false);

		ExperimentManager.LoadPreviousSlide((index, questions) => this.SlideData(new SlideModel("Slides/Default", index, this.AreAllQuestionsAnswered, questions)));
	}

	private UnloadSlide(complete:boolean):void
	{
		this.IsHighlighted(false);

		if (complete && this.SlideData() != null)
		{
			const oldSlide = this.SlideData();
			this.SlideData().Complete(() => ExperimentManager.CloseSlide(oldSlide.Index));
		}

		this.SlideData(null);
	}

	public Close():void
	{
		ExperimentManager.Close();
	}
}

export = SlideShell;