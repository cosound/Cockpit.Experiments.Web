import knockout = require("knockout");
import CockpitPortal = require("Managers/Portal/Cockpit");
import Notification = require("Managers/Notification");
import AudioInformationComponent from "Components/Questions/AudioInformationRetrieval/AudioInformationComponent";
import Time from "Utility/Time";

type SearchResult = {Name:string, ChannelName:string, Start:string, Duration:string, Relevance:string, IsSelected:KnockoutComputed<boolean>, Select:()=>void, Data: CockpitPortal.IAudioInformation}

export default class Search extends AudioInformationComponent
{
	public Header:string = "";
	public ButtonLabel:string = "";

	public Query = knockout.observable("def");
	public Results = knockout.observableArray<SearchResult>();
	public Selected = knockout.observable<SearchResult>();

	public HasSearched:KnockoutComputed<boolean>;

	private _functionValue:string;
	private _searchCallback:(query:string)=>void;

	constructor(searchView:any, searchCallback:(query:string)=>void, predefinedData:any|null)
	{
		super(searchView);

		if(this.IsVisible)
		{
			this.Header = searchView["Header"]["Label"];
			this.ButtonLabel = searchView["Button"]["Label"];
			this._functionValue = searchView.Query.Uri;
		}

		this._searchCallback = searchCallback;

		if(predefinedData != null && predefinedData.Items && predefinedData.Items.Item && predefinedData.Items.Item.length > 0)
			this.Results(predefinedData.Items.Item.map(r => this.CreateSearchResult(r)));

		this.HasSearched = this.PureComputed(()=> this.Results().length != 0);
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
			this.Results.push(...response.Body.Results.map(r => this.CreateSearchResult(r)));
		});
	}

	private CreateSearchResult(result:CockpitPortal.IAudioInformation):SearchResult
	{
		let item:SearchResult = {
			Name: result.Metadata.Fields["MyProgrammeName"].Value,
			ChannelName: result.Metadata.Fields["MyChannelHeaderLabel"].Value,
			Start: result.Metadata.Fields["MyPublicationStartDate"].Value,
			Duration: Time.ToPrettyTimeFromString(result.Metadata.Fields["MyPublicationDuration"].Value),
			Relevance: result.Metadata.Fields["MyRelevance"].Value,
			IsSelected: null,
			Select: null,
			Data: result
		};

		item.IsSelected = this.PureComputed(() => this.Selected() == item);
		item.Select = () => this.Selected(item);
		return item;
	}
}