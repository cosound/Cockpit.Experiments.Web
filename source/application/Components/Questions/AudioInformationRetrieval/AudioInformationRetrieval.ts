import knockout = require("knockout");
import QuestionModel = require("Models/Question");
import QuestionBase = require("Components/Questions/QuestionBase");
import WayfAuthenticator from "Components/Questions/AudioInformationRetrieval/WayfAuthenticator";
import Search from "Components/Questions/AudioInformationRetrieval/Search";
import Rating from "Components/Questions/AudioInformationRetrieval/Rating";
import TimeLineHandler from "Components/Questions/AudioInformationRetrieval/TimeLineHandler";
import Audio from "Utility/Audio";


type Selection = {Identifier:string};

class AudioInformationRetrieval extends QuestionBase<{Selections:Selection[]}>
{
	public SearchViewHeader:string;

	public Search:Search;
	public Rating:Rating;
	public TimeLine:TimeLineHandler;

	public HasSelected:KnockoutComputed<boolean>;

	public IsLoginReady:KnockoutObservable<boolean>;
	public IsAuthenticated:KnockoutObservable<boolean>;
	public CanLogin:KnockoutObservable<boolean>;
	private _wayfAuthenticator:WayfAuthenticator;

	public Position:KnockoutComputed<number>;
	public Duration:KnockoutComputed<number>;
	private _audio = knockout.observable<Audio>();

	constructor(question: QuestionModel)
	{
		super(question);

		this.InitializeWayf();

		let searchView = this.GetInstrument("SearchView");

		this.SearchViewHeader = searchView["Header"]["Label"];
		this.Search = new Search(searchView);
		this.Rating = new Rating();

		this.Position = this.PureComputed(() => this._audio() != null ? this._audio().Position() : 0);
		this.Duration = this.PureComputed(() => this._audio() != null ? this._audio().Duration() : 0);

		this.TimeLine = new TimeLineHandler(this.Position, this.Duration);
		this.HasSelected = this.PureComputed(()=> this.Search.Selected() != null);

		this.Subscribe(this.Search.Selected, s => {
			this.LoadAudio(s.Data.Stimulus.URI);
			this.TimeLine.LoadData(s.Data.Segments);
		});
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

	private LoadAudio(assetGuid:string):void
	{
		this._wayfAuthenticator.GetAsset(assetGuid, asset => {
			this._audio(new Audio(asset.Files[0].Destinations[0].Url));
			this._audio().Volume(10);

			this.AddAction(this._audio().IsReady, () => {
				this._audio().Play();
			});
		});
	}
}

export  = AudioInformationRetrieval;