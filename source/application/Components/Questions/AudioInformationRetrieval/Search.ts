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

	constructor(searchButtonLabel:string)
	{
		super();
		this.ButtonLabel = searchButtonLabel;

		this.HasSearched = this.PureComputed(()=> this.Results().length != 0);
	}

	public Search():void
	{
		CockpitPortal.AudioInformation.Search(this.Query(),"/home/ubuntu/wp0x-store/00001_cosound/01000_custom/01010_speechtranscription/system/740_plugin/source/asrindexquery/published/31a13888-bc05-4a6f-aec5-36dab32ea576/query.sh").WithCallback(response => {
			if(response.Error != null)
			{
				Notification.Error("Failed to search: " + response.Error.Message);
				return;
			}
			console.log(response.Body.Results[0]);
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