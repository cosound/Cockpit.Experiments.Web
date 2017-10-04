import knockout = require("knockout");
import CockpitPortal = require("Managers/Portal/Cockpit");
import AudioInformationComponent from "Components/Questions/AudioInformationRetrieval/AudioInformationComponent";
import Time from "Utility/Time";

type SearchResult = {Name:string, ChannelName:string, Start:string, Duration:string, Relevance:string, IsSelected:KnockoutComputed<boolean>, Select:()=>void, Data: CockpitPortal.IAudioInformation}

export default class Search extends AudioInformationComponent
{
	public Results = knockout.observableArray<SearchResult>(null);
	public Selected = knockout.observable<SearchResult>();

	public HasResults:KnockoutComputed<boolean>

	constructor(itemListView:any, results:KnockoutObservable<CockpitPortal.IAudioInformation[]|null>, predefinedData:any|null)
	{
		super(itemListView);

		if(this.IsVisible)
		{
			/*if(predefinedData != null && predefinedData.Items && predefinedData.Items.Item && predefinedData.Items.Item.length > 0)
			this.Results(predefinedData.Items.Item.map(r => this.CreateSearchResult(r)));*/
		}

		this.HasResults = this.PureComputed(() => this.Results() != null);

		this.Subscribe(results, r => {
			this.Results.removeAll();
			this.Results.push(...r.map(i => this.CreateSearchResult(i)));
		})
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