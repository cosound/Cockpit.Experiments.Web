import knockout = require("knockout");
import Time from "Utility/Time";
import CockpitPortal = require("Managers/Portal/Cockpit");
import DisposableComponent = require("Components/DisposableComponent");
import MetadataExtractor from "Components/Questions/AudioInformationRetrieval/MetadataExtractor";
import AudioInformationComponent from "Components/Questions/AudioInformationRetrieval/AudioInformationComponent";

export default class SegmentList extends AudioInformationComponent
{
	public Header:string;
	public Segments = knockout.observableArray<Segment>();

	constructor(data: any, private metadataExtractor: MetadataExtractor, private selectedSegment:KnockoutObservable<CockpitPortal.IAudioInformationSegment>, private formatter:(value:string)=>string, private playCallback:(position:number)=>void)
	{
		super(data);

		this.Header = data.Header;
	}

	public LoadData(segments: CockpitPortal.IAudioInformationSegment[])
	{
		this.Segments().forEach(s => s.dispose());
		this.Segments.removeAll();

		this.Segments.push(...segments.map(s => new Segment(s, this.metadataExtractor, this.selectedSegment, this.formatter, this.playCallback)));
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
	public ExpandedFields:{Key:string, Value:string}[];
	public IsSelected:KnockoutComputed<boolean>;

	constructor(private data:CockpitPortal.IAudioInformationSegment, metadataExtractor: MetadataExtractor, private selectedSegment:KnockoutObservable<CockpitPortal.IAudioInformationSegment>, formatter:(value:string)=>string, private playCallback:(position:number)=>void)
	{
		super();
		this.StartTime = data.StartTime;
		this.EndTime = data.EndTime;
		this.Content = metadataExtractor.GetHeader(this.data);
		this.ExpandedFields = metadataExtractor.GetNoneHeaders(this.data).map(f => ({Key: f.Key, Value: formatter(f.Value)}));
		this.IsSelected = this.PureComputed(() => this.data == this.selectedSegment());
	}

	public Select():void
	{
		this.selectedSegment(this.data);
	}

	public Play():void
	{
		this.playCallback(Time.ToMillisecondsFromPrettyTime(this.StartTime));
	}
}