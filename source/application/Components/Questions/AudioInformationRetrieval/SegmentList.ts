import knockout = require("knockout");
import DisposableComponent = require("Components/DisposableComponent");
import MetadataExtractor from "Components/Questions/AudioInformationRetrieval/MetadataExtractor";

export default class SegmentList extends DisposableComponent
{
	public Header:string;
	public Segments = knockout.observableArray<Segment>();

	constructor(data: any, private metadataExtractor: MetadataExtractor)
	{
		super();

		this.Header = data.Header;
	}

	public LoadData(segments: any[])
	{
		this.Segments.removeAll();

		this.Segments.push(...segments.map(s => new Segment(s, this.metadataExtractor)));
	}
}

class Segment
{
	public StartTime:string;
	public EndTime:string;
	public Content:string;

	constructor(data:any, metadataExtractor: MetadataExtractor)
	{
		this.StartTime = data.StartTime;
		this.EndTime = data.EndTime;
		this.Content = metadataExtractor.GetHeader(data);
	}
}