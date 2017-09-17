import knockout = require("knockout");
import QuestionModel = require("Models/Question");
import QuestionBase = require("Components/Questions/QuestionBase");
import WayfAuthenticator from "Components/Questions/AudioInformationRetrieval/WayfAuthenticator";
import Search from "Components/Questions/AudioInformationRetrieval/Search";
import Rating from "Components/Questions/AudioInformationRetrieval/Rating";
import TimeLineHandler from "Components/Questions/AudioInformationRetrieval/TimeLineHandler";
import SegmentList from "Components/Questions/AudioInformationRetrieval/SegmentList";
import MetadataExtractor from "Components/Questions/AudioInformationRetrieval/MetadataExtractor";
import Audio from "Components/Questions/AudioInformationRetrieval/Audio";

type Selection = {Id:string, Rating:string};

class AudioInformationRetrieval extends QuestionBase<{Selections:Selection[]}>
{
	public Search:Search;
	public Rating:Rating;
	public TimeLine:TimeLineHandler;
	public Audio:Audio;
	public SegmentList:SegmentList;

	public HasSelected:KnockoutComputed<boolean>;

	public IsLoginReady:KnockoutObservable<boolean>;
	public IsAuthenticated:KnockoutObservable<boolean>;
	public CanLogin:KnockoutObservable<boolean>;

	private _wayfAuthenticator:WayfAuthenticator;
	private _metadataExtractor:MetadataExtractor;

	constructor(question: QuestionModel)
	{
		super(question);

		this.InitializeWayf();

		this._metadataExtractor = new MetadataExtractor(this.GetInput("MetadataSchema").MetadataSchema);

		this.Search = new Search(this.GetInstrument("SearchView"), q => this.AddEvent("Search", null, null, q));
		this.Rating = new Rating(this.GetInstrument("ItemEvaluationView"));
		this.Audio = new Audio(this._wayfAuthenticator);

		this.TimeLine = new TimeLineHandler(this.Audio.Position, this.Audio.Duration, this.GetInstrument("PlayerView"), this._metadataExtractor);
		this.SegmentList = new SegmentList(this.GetInstrument("SegmentListView"));

		this.InitializeSelected();
	}

	private InitializeSelected():void
	{
		this.HasSelected = this.PureComputed(()=> this.Search.Selected() != null);

		this.Subscribe(this.Search.Selected, s => {
			this.Audio.Load(s.Data.Stimulus.URI);
			this.TimeLine.LoadData(s.Data.Segments);
			this.SegmentList.LoadData(s.Data.Segments);

			this.Rating.Selected(this.GetRatingFromAnswer(s.Data.Id));

			this.AddEvent("Result Selected", null, null, s.Data.Id);
		});

		this.Subscribe(this.Rating.Selected, s => this.UpdateAnswerWithSelectionRating(this.Search.Selected().Data.Id, s));
	}

	private UpdateAnswerWithSelectionRating(selectionId:string, rating:string):void
	{
		let answer = this.GetAnswer();

		if(answer.Selections == null || <any>answer.Selections == "")
			answer.Selections = [];

		for(let i = 0; i < answer.Selections.length; i++)
		{
			if(answer.Selections[i].Id !== selectionId)
				continue;

			answer.Selections[i].Rating = rating;
			this.SetAnswer(answer);
			return;
		}

		answer.Selections.push({Id: selectionId, Rating: rating});
		this.SetAnswer(answer);
	}

	private GetRatingFromAnswer(selectionId:string):string
	{
		let answer = this.GetAnswer();

		if(answer.Selections == null || <any>answer.Selections == "")
			return null;

		for(let i = 0; i < answer.Selections.length; i++)
		{
			if(answer.Selections[i].Id !== selectionId)
				continue;

			return answer.Selections[i].Rating;
		}

		return null;
	}

	private InitializeWayf():void
	{
		this._wayfAuthenticator = new WayfAuthenticator();

		this.IsLoginReady = this._wayfAuthenticator.IsReady;
		this.IsAuthenticated = this._wayfAuthenticator.IsAuthenticated;
		this.CanLogin = this._wayfAuthenticator.CanLogin;
	}

	public Login():void
	{
		this._wayfAuthenticator.Login();
	}
}

export  = AudioInformationRetrieval;