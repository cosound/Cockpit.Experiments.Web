import knockout = require("knockout");
import CockpitPortal = require("Managers/Portal/Cockpit");
import Notification = require("Managers/Notification");
import AudioInformationComponent from "Components/Questions/AudioInformationRetrieval/AudioInformationComponent";

export default class Search extends AudioInformationComponent
{
	public Header:string = "";
	public ButtonLabel:string = "";

	public Query = knockout.observable("def");
	public Results = knockout.observable<CockpitPortal.IAudioInformation[]|null>(null);

	public HasSearched:KnockoutComputed<boolean>;

	private _functionValue:string;
	private _searchCallback:(query:string)=>void;

	constructor(searchView:any, searchCallback:(query:string)=>void)
	{
		super(searchView);

		if(this.IsVisible)
		{
			this.Header = searchView["Header"]["Label"];
			this.ButtonLabel = searchView["Button"]["Label"];
			this._functionValue = searchView.Query.Uri;
		}

		this._searchCallback = searchCallback;

		this.HasSearched = this.PureComputed(()=> this.Results() != null);
	}

	public Search():void
	{
		this._searchCallback(this.Query());

		CockpitPortal.AudioInformation.Search(this.Query(),this._functionValue).WithCallback(response => {
			if(response.Error != null)
			{
				Notification.Error("Failed to search: " + response.Error.Message);
				return;
			}
			this.Results(response.Body.Results);
		});
	}
}