﻿import knockout = require("knockout");
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
	private _activeAnswerSets: KnockoutObservable<number> = knockout.observable(0);
	private _isWorking:KnockoutObservable<boolean> = knockout.observable(false);
	private _isCompleted = false;

	public Questions: QuestionModel[] = [];
	public HaveActiveAnswersSets:KnockoutComputed<boolean>;

	constructor(slide: SlideModel)
	{
		super();
		this._slide = slide;
		slide.SlideCompleted = (waitForSave, callback) => this.SlideCompleted(waitForSave, callback);
		slide.ScrollToFirstInvalidAnswerCallback = () => this.ScrollToFirstInvalidAnswer();

		this.HaveActiveAnswersSets = this.Computed(() => this._activeAnswerSets() !== 0);
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
			this.Subscribe(questionModel.HasValidAnswer, () => {
				this.CheckIfAllQuestionsAreAnswered()
			});
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
	}

	private SlideCompleted(waitForSave:boolean, completed: () => void):void
	{
		this._isCompleted = true;

		if(waitForSave)
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
			this._activeAnswerSets(this._activeAnswerSets() + 1);

			ExperimentManager.SaveQuestionAnswer(question.Id, question.Answer(), success =>
			{
				if (!success) question.HasValidAnswer(false);

				this._isWorking(true);
				this._activeAnswerSets(this._activeAnswerSets() - 1);
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
			if (this.Questions[i].RequiresInput && !this.Questions[i].HasValidAnswer()) return this.Questions[i];
		}

		return null;
	}

	private CheckIfAllQuestionsAreAnswered():void
	{
		if(this._isCompleted)
			return

		this._slide.CanGoToNextSlide(this.GetFirstQuestionWithoutValidAnswer() == null && !this.HaveActiveAnswersSets());
	}
}

export = Default;