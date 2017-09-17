import knockout = require("knockout");
import CockpitPortal = require("Managers/Portal/Cockpit");
import Notification = require("Managers/Notification");
import DisposableComponent = require("Components/DisposableComponent");

type SearchResult = {Name:string, ChannelName:string, Start:string, IsSelected:KnockoutComputed<boolean>, Select:()=>void, Data: CockpitPortal.IAudioInformation}

export default class Search extends DisposableComponent
{
	public Header:string;
	public ButtonLabel:string;

	public Query = knockout.observable("def");
	public Results = knockout.observableArray<SearchResult>();
	public Selected = knockout.observable<SearchResult>();

	public HasSearched:KnockoutComputed<boolean>;

	private _functionValue:string;
	private _searchCallback:(query:string)=>void;

	constructor(searchView:any, searchCallback:(query:string)=>void)
	{
		super();
		this.Header = searchView["Header"]["Label"];
		this.ButtonLabel = searchView["Button"]["Label"];
		this._functionValue = searchView.Query.Uri;
		this._searchCallback = searchCallback;

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
			IsSelected: null,
			Select: null,
			Data: result
		};

		item.IsSelected = this.PureComputed(() => this.Selected() == item);
		item.Select = () => this.Selected(item);
		return item;
	}
}