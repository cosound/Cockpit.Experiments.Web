import knockout = require("knockout");
import DisposableComponent = require("Components/DisposableComponent");

export default class SegmentList extends DisposableComponent
{
	public Segments = knockout.observableArray<Segment>();

	constructor()
	{
		super();
	}

	public LoadData(segments: any[])
	{
		this.Segments.removeAll();

		this.Segments.push(...segments.map(s => new Segment(s)));
	}
}

class Segment
{
	public StartTime:string;
	public EndTime:string;
	public Content:string;

	constructor(data:any)
	{
		this.StartTime = data.StartTime;
		this.EndTime = data.EndTime;
		this.Content = this.GetContent(data);
	}

	private GetContent(data:any):string
	{
		try {
			return data.Metadata.Fields.MyTranscriptionAsString.Value
		}
		catch (error)
		{
			return "Unknown Format"
		}
	}
}