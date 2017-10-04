import knockout = require("knockout");
import CockpitPortal = require("Managers/Portal/Cockpit");
import QuestionModel = require("Models/Question");
import QuestionBase = require("Components/Questions/QuestionBase");
import WayfAuthenticator from "Components/Questions/AudioInformationRetrieval/WayfAuthenticator";
import Search from "Components/Questions/AudioInformationRetrieval/Search";
import Rating from "Components/Questions/AudioInformationRetrieval/Rating";
import TimeLineHandler from "Components/Questions/AudioInformationRetrieval/TimeLineHandler";
import SegmentList from "Components/Questions/AudioInformationRetrieval/SegmentList";
import MetadataExtractor from "Components/Questions/AudioInformationRetrieval/MetadataExtractor";
import Audio from "Components/Questions/AudioInformationRetrieval/Audio";

type Selection = {Id:string, Rating:string, SegmentRatings: string};
type SegmentRating = {Id:string, Rating:string};

class AudioInformationRetrieval extends QuestionBase<{Selections:Selection[]}>
{
	public Search:Search;
	public Rating:Rating;
	public TimeLine:TimeLineHandler;
	public Audio:Audio;
	public SegmentList:SegmentList;
	public SegmentRating:Rating;

	public HasSelected:KnockoutComputed<boolean>;
	public HasSelectedSegment:KnockoutComputed<boolean>;

	public IsLoginReady:KnockoutObservable<boolean>;
	public IsAuthenticated:KnockoutObservable<boolean>;
	public CanLogin:KnockoutObservable<boolean>;
	public SelectedSegment:KnockoutObservable<CockpitPortal.IAudioInformationSegment>;

	private _wayfAuthenticator:WayfAuthenticator;
	private _metadataExtractor:MetadataExtractor;

	constructor(question: QuestionModel)
	{
		super(question);

		this.InitializeWayf();

		this._metadataExtractor = new MetadataExtractor(this.GetInput("MetadataSchema").MetadataSchema);
		this.SelectedSegment = knockout.observable(null);
		this.HasSelectedSegment = this.PureComputed(()=> this.SelectedSegment() != null);

		this.Search = new Search(this.GetInstrument("SearchView"), q => this.AddEvent("Search", null, null, q), this.GetInput("Data", false));
		this.Rating = new Rating(this.GetInstrument("ItemEvaluationView"));
		this.SegmentRating = new Rating(this.GetInstrument("SegmentEvaluationView"));
		this.Audio = new Audio(this.GetInstrument("PlayerView"), this._wayfAuthenticator);
		this.TimeLine = new TimeLineHandler(this.GetInstrument("PlayerView"), this.Audio.Position, this.Audio.Duration, this._metadataExtractor, this.SelectedSegment);
		this.SegmentList = new SegmentList(this.GetInstrument("SegmentListView"), this._metadataExtractor, this.SelectedSegment, v => this.GetFormatted(v), p => {
			this.Audio.Position(p);
			this.Audio.Audio().Play();
			this.AddEvent("Player", this.Search.Selected().Data.Id, "Jump", JSON.stringify({Position: p}));
		});

		this.Subscribe(this.Audio.IsPlaying, p => this.AddEvent("Player", this.Search.Selected().Data.Id, "TooglePlay", JSON.stringify({IsPlaying: p, Position: this.Audio.Position()})));
		this.InitializeSelected();
		this.InitializeSegmentRating();
	}

	private InitializeSelected():void
	{
		this.HasSelected = this.PureComputed(()=> this.Search.Selected() != null);

		this.Subscribe(this.Search.Selected, s => {
			this.Audio.Load(s.Data.Stimulus.URI);
			this.TimeLine.LoadData(s.Data.Segments);
			this.SegmentList.LoadData(s.Data.Segments);

			this.Rating.Selected(this.GetRatingFromAnswer(s.Data.Id));

			this.AddEvent("Result Selected", s.Data.Id);
		});

		this.Subscribe(this.Rating.Selected, rating => {
			this.UpdateAnswer(this.Search.Selected().Data.Id, s => s.Rating = rating);
			this.AddEvent("Answer", this.Search.Selected().Data.Id, "Selection", JSON.stringify({Rating: rating}));
		});
	}

	private InitializeSegmentRating():void
	{
		this.Subscribe(this.SelectedSegment, segment => {
			this.SegmentRating.Selected(this.GetSegmentRatingFromAnswer(this.Search.Selected().Data.Id, segment.Id));
			this.AddEvent("Segment Selected", segment.Id, null, JSON.stringify({SelectionId: this.Search.Selected().Data.Id}));
		});
		this.Subscribe(this.SegmentRating.Selected, rating => {
			this.UpdateSegmentAnswer(this.Search.Selected().Data.Id, this.SelectedSegment().Id, rating);
			this.AddEvent("Answer", this.Search.Selected().Data.Id, "Segment", JSON.stringify({SegmentId: this.SelectedSegment().Id, Rating: rating}));
		});
	}

	private GetSegmentRatingFromAnswer(selectionId:string, segmentId:string):string
	{
		let selection = this.GetSelectionFromAnswer(selectionId);

		if(selection == null || selection.SegmentRatings == null)
			return null;

		const ratings = JSON.parse(selection.SegmentRatings) as SegmentRating[];

		for(let i = 0 ; i < ratings.length; i++)
		{
			if(ratings[i].Id !== segmentId)
				continue;

			return ratings[i].Rating;
		}

		return null;
	}

	private GetRatingFromAnswer(selectionId:string):string
	{
		let selection = this.GetSelectionFromAnswer(selectionId);

		return selection != null ? selection.Rating : null;
	}

	private UpdateSegmentAnswer(selectionId:string, segmentId:string, rating:string):void
	{
		this.UpdateAnswer(selectionId, selection => {

			const ratings = JSON.parse(selection.SegmentRatings) as SegmentRating[];

			for(let i = 0; i < ratings.length; i++)
			{
				if(ratings[i].Id !== segmentId)
					continue;

				ratings[i].Rating = rating;
				selection.SegmentRatings = JSON.stringify(ratings)
				return;
			}
			ratings.push({Id: segmentId, Rating: rating});

			selection.SegmentRatings = JSON.stringify(ratings);
		});
	}

	private UpdateAnswer(selectionId:string, callback:(selection:Selection)=>void):void
	{
		let answer = this.GetAnswer();

		if(answer.Selections == null || <any>answer.Selections == "")
			answer.Selections = [];

		for(let i = 0; i < answer.Selections.length; i++)
		{
			if(answer.Selections[i].Id !== selectionId)
				continue;

			if(!answer.Selections[i].SegmentRatings)
				answer.Selections[i].SegmentRatings = "[]";

			callback(answer.Selections[i]);

			this.SetAnswer(answer);
			return;
		}

		let selection:Selection = {Id: selectionId, Rating: null, SegmentRatings: "[]"};

		callback(selection);

		answer.Selections.push(selection);

		this.SetAnswer(answer);
	}

	private GetSelectionFromAnswer(selectionId:string):Selection
	{
		let answer = this.GetAnswer();

		if(answer.Selections == null || <any>answer.Selections == "")
			return null;

		for(let i = 0; i < answer.Selections.length; i++)
		{
			if(answer.Selections[i].Id !== selectionId)
				continue;

			return answer.Selections[i];
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