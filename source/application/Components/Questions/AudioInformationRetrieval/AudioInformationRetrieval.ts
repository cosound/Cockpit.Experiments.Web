import knockout = require("knockout");
import CockpitPortal = require("Managers/Portal/Cockpit");
import Notification = require("Managers/Notification");
import Configuration = require("Managers/Configuration");
import QuestionModel = require("Models/Question");
import QuestionBase = require("Components/Questions/QuestionBase");
import WayfAuthenticator from "Components/Questions/AudioInformationRetrieval/WayfAuthenticator";
import Search from "Components/Questions/AudioInformationRetrieval/Search";
import TimeLine from "Components/Questions/AudioInformationRetrieval/TimeLine";
import Audio from "Utility/Audio";

type Selection = {Identifier:string};

class AudioInformationRetrieval extends QuestionBase<{Selections:Selection[]}>
{
	public SearchViewHeader:string;

	public Search:Search;
	public TimeLine:TimeLine;

	public HasSelected:KnockoutComputed<boolean>;

	public IsLoginReady:KnockoutObservable<boolean>;
	public IsAuthenticated:KnockoutObservable<boolean>;
	public CanLogin:KnockoutObservable<boolean>;
	private _wayfAuthenticator:WayfAuthenticator;

	public Position:KnockoutComputed<number>;
	private _audio = knockout.observable<Audio>();

	constructor(question: QuestionModel)
	{
		super(question);

		this.InitializeWayf();

		let searchView = this.GetInstrument("SearchView");

		this.SearchViewHeader = searchView["Header"]["Label"];
		this.Search = new Search(searchView["Button"]["Label"]);
		this.TimeLine = new TimeLine();

		this.Position = this.PureComputed(() => this._audio() != null ? this._audio().Position() : 0);
		this.TimeLine.Position = this.Position;
		this.HasSelected = this.PureComputed(()=> this.Search.Selected() != null);

		this.Subscribe(this.Search.Selected, s => this.LoadAudio("f091ae97-3360-4a25-bc9d-ec05df6924a5"));
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
				this.TimeLine.Length(this._audio().Duration());
				this.TimeLine.ZoomLevel(0.1);

			});
		});
	}
}

export  = AudioInformationRetrieval;