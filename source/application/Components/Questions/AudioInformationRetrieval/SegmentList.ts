import knockout = require("knockout");
import CockpitPortal = require("Managers/Portal/Cockpit");
import DisposableComponent = require("Components/DisposableComponent");
import MetadataExtractor from "Components/Questions/AudioInformationRetrieval/MetadataExtractor";

export default class SegmentList extends DisposableComponent
{
	public Header:string;
	public Segments = knockout.observableArray<Segment>();

	constructor(data: any, private metadataExtractor: MetadataExtractor, private selectedSegment:KnockoutObservable<CockpitPortal.IAudioInformationSegment>)
	{
		super();

		this.Header = data.Header;
	}

	public LoadData(segments: CockpitPortal.IAudioInformationSegment[])
	{
		this.Segments().forEach(s => s.dispose());
		this.Segments.removeAll();

		this.Segments.push(...segments.map(s => new Segment(s, this.metadataExtractor, this.selectedSegment)));
	}

	public dispose():void
	{
		super.dispose();
		this.Segments().forEach(s => s.dispose());
	}
}

class Segment extends DisposableComponent
{
	public StartTime:string;
	public EndTime:string;
	public Content:string;
	public IsSelected:KnockoutComputed<boolean>;

	constructor(data:CockpitPortal.IAudioInformationSegment, metadataExtractor: MetadataExtractor, selectedSegment:KnockoutObservable<CockpitPortal.IAudioInformationSegment>)
	{
		super();
		this.StartTime = data.StartTime;
		this.EndTime = data.EndTime;
		this.Content = metadataExtractor.GetHeader(data);
		this.IsSelected = this.PureComputed(() => data == selectedSegment());
	}
}