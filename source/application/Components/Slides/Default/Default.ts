import knockout = require("knockout");
import SlideModel = require("Models/Slide");
import QuestionModel = require("Models/Question");
import ExperimentManager = require("Managers/Portal/Experiment");
import CockpitPortal = require("Managers/Portal/Cockpit");
import NameConventionLoader = require("Components/NameConventionLoader");
import DisposableComponent = require("Components/DisposableComponent");

class Default extends DisposableComponent
{
	private _slide: SlideModel;
	private _uiLessQuestions: IQuestionViewModel[] = [];
	private _activeAnsweSets: KnockoutObservable<number> = knockout.observable(0);
	private _isWorking:KnockoutObservable<boolean> = knockout.observable(false);

	public Questions: QuestionModel[] = [];
	public HaveActiveAnswersSets:KnockoutComputed<boolean>;

	constructor(slide: SlideModel)
	{
		super();
		this._slide = slide;
		slide.SlideCompleted = callback => this.SlideCompleted(callback);
		slide.ScrollToFirstInvalidAnswerCallback = () => this.ScrollToFirstInvalidAnswer();

		this.HaveActiveAnswersSets = this.Computed(() => this._activeAnsweSets() !== 0);
		slide.SetIsWorking(this.Computed(() => this._isWorking() || this.HaveActiveAnswersSets()));

		this.InitializeQuestions(slide.Questions);
	}

	private InitializeQuestions(questions: CockpitPortal.IQuestion[]):void
	{
		var numberToLoad = questions.length;
		var loaded = () => { if (--numberToLoad === 0) this.SlideLoaded(); }

		for (var i = 0; i < questions.length; i++)
		{
			var questionModel = new QuestionModel(questions[i], question => this.AnswerChanged(question), loaded);
			this.Subscribe(questionModel.HasValidAnswer, () => this.CheckIfAllQuestionsAreAnswered());
			this.Questions.push(questionModel);

			if (!questionModel.HasUIElement)
				((m: QuestionModel) => require([NameConventionLoader.GetFilePath(questionModel.Type)],(vm: any) => this._uiLessQuestions.push(new vm(m))))(questionModel);
		}

		if (questions.length === 0)
			this.SlideLoaded();
	}

	private SlideLoaded(): void
	{
		for (var i = 0; i < this._uiLessQuestions.length; i++)
			this._uiLessQuestions[i].SlideLoaded();

		this.CheckIfAllQuestionsAreAnswered();

		console.log("SlideLoaded", this._slide.CanGoToNextSlide())
	}

	private SlideCompleted(completed: () => void):void
	{
		var waitForAnswerSaved = false;

		for (var i = 0; i < this._uiLessQuestions.length; i++)
		{
			waitForAnswerSaved = this._uiLessQuestions[i].SlideCompleted() || waitForAnswerSaved;
		}

		if (waitForAnswerSaved)
		{
			this.SubscribeUntilChange(this.HaveActiveAnswersSets, completed)
		} else
			completed();
	}

	private ScrollToFirstInvalidAnswer():void
	{
		const question = this.GetFirstQuestionWithoutValidAnswer();

		if(question != null) question.ScrollTo(ExperimentManager.ScrollToInvalidAnswerDuration);
	}

	private AnswerChanged(question: QuestionModel):void
	{
		if (question.HasValidAnswer())
		{
			this._activeAnsweSets(this._activeAnsweSets() + 1);

			ExperimentManager.SaveQuestionAnswer(question.Id, question.Answer(), success =>
			{
				if (!success) question.HasValidAnswer(false);

				this._isWorking(true);
				this._activeAnsweSets(this._activeAnsweSets() - 1);
				this.CheckIfAllQuestionsAreAnswered();
				this._isWorking(false);
			});
		}

		this.CheckIfAllQuestionsAreAnswered();
	}

	private GetFirstQuestionWithoutValidAnswer(): QuestionModel
	{
		for (let i = 0; i < this.Questions.length; i++)
		{
			console.log(this.Questions[i].Type, this.Questions[i].RequiresInput, this.Questions[i].HasValidAnswer())

			if (this.Questions[i].RequiresInput && !this.Questions[i].HasValidAnswer()) return this.Questions[i];
		}

		return null;
	}

	private CheckIfAllQuestionsAreAnswered():void
	{
		console.log("CheckIfAllQuestionsAreAnswered", "Start")

		this._slide.CanGoToNextSlide(this.GetFirstQuestionWithoutValidAnswer() == null && !this.HaveActiveAnswersSets());

		console.log("CheckIfAllQuestionsAreAnswered", this._slide.CanGoToNextSlide())
	}
}

export = Default;