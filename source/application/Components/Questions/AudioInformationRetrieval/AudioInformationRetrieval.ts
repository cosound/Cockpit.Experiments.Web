import knockout = require("knockout");
import CockpitPortal = require("Managers/Portal/Cockpit");
import Notification = require("Managers/Notification");
import Configuration = require("Managers/Configuration");
import QuestionModel = require("Models/Question");
import QuestionBase = require("Components/Questions/QuestionBase");
import WayfAuthenticator from "Components/Questions/AudioInformationRetrieval/WayfAuthenticator";
import Search from "Components/Questions/AudioInformationRetrieval/Search";
import TimeLine from "Components/Questions/AudioInformationRetrieval/TimeLine";
import Rating from "Components/Questions/AudioInformationRetrieval/Rating";
import Audio from "Utility/Audio";
import {Timeline} from "vis";

type Selection = {Identifier:string};

class AudioInformationRetrieval extends QuestionBase<{Selections:Selection[]}>
{
	public SearchViewHeader:string;

	public Search:Search;
	public Rating:Rating;

	public TimeLineElement = knockout.observable<HTMLElement|null>(null);
	public TimeLine:Timeline|null = null;

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
		this.Search = new Search(searchView);
		this.Rating = new Rating();

		this.Position = this.PureComputed(() => this._audio() != null ? this._audio().Position() : 0);
		/*this.TimeLine.Length = this.PureComputed(() => this._audio() != null ? this._audio().Duration() : 1);
		this.TimeLine.Position = this.Position;*/
		this.HasSelected = this.PureComputed(()=> this.Search.Selected() != null);

		this.Subscribe(this.Search.Selected, s => this.LoadAudio(s.Data.Stimulus.URI));

		this.SubscribeUntilChange(this.TimeLineElement, e => {

			var data = [
				{id: 1, content: 'item 1', start: '2013-04-20'},
				{id: 2, content: 'item 2', start: '2013-04-14'},
				{id: 3, content: 'item 3', start: '2013-04-18'},
				{id: 4, content: 'item 4', start: '2013-04-16', end: '2013-04-19'},
				{id: 5, content: 'item 5', start: '2013-04-25'},
				{id: 6, content: 'item 6', start: '2013-04-27'}
			];

			this.TimeLine = new Timeline(e, data, {})
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
				//this.TimeLine.Initialize();
				this._audio().Play();
			});
		});
	}
}

export  = AudioInformationRetrieval;