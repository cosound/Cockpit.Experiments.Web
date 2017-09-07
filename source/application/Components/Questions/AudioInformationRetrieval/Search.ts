import knockout = require("knockout");
import CockpitPortal = require("Managers/Portal/Cockpit");
import Notification = require("Managers/Notification");
import DisposableComponent = require("Components/DisposableComponent");

type SearchResult = {Name:string, ChannelName:string, Start:string, IsSelected:KnockoutComputed<boolean>, Select:()=>void, Data:any}

export default class Search extends DisposableComponent
{
	public ButtonLabel:string;

	public Query = knockout.observable("");
	public Results = knockout.observableArray<SearchResult>();
	public Selected = knockout.observable<SearchResult>();

	public HasSearched:KnockoutComputed<boolean>;

	private _functionValue:string;

	constructor(searchView:any)
	{
		super();
		this.ButtonLabel = searchView["Button"]["Label"];
		this._functionValue = searchView.Query.Uri;

		this.HasSearched = this.PureComputed(()=> this.Results().length != 0);
	}

	public Search():void
	{
		CockpitPortal.AudioInformation.Search(this.Query(),this._functionValue).WithCallback(response => {
			if(response.Error != null)
			{
				Notification.Error("Failed to search: " + response.Error.Message);
				return;
			}
			this.Results.push(...response.Body.Results.map(r => this.CreateSearchResult(r)));
		});
	}

	private CreateSearchResult(result:any):SearchResult
	{
		let item:SearchResult = {
			Name: result.Metadata.Fields.MyProgrammeName.Value,
			ChannelName: result.Metadata.Fields.MyChannelHeaderLabel.Value,
			Start: result.Metadata.Fields.MyPublicationStartDate.Value,
			IsSelected: null,
			Select: null,
			Data: result
		};

		item.IsSelected = this.PureComputed(() => this.Selected() == item);
		item.Select = () => this.Selected(item);
		return item;
	}
}