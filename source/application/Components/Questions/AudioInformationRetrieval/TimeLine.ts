import knockout = require("knockout");
import DisposableComponent = require("Components/DisposableComponent");

type Segment = {Title:string, Start:number, End:number, Length:number};
type Channel = {Title:string, Segments:Segment[], TrackElement:KnockoutObservable<HTMLElement>};
type TimeSegment = {Text:string, Position:number};

export default class TimeLine extends DisposableComponent
{
	public TracksElement = knockout.observable<HTMLElement>(null);

	public Channels = knockout.observableArray<Channel>();
	public TimeSegments = knockout.observableArray<TimeSegment>();

	public ZoomLevel = knockout.observable(1);
	public Position:KnockoutComputed<number>;
	public Length:KnockoutComputed<number>;

	constructor()
	{
		super();

		this.Channels.push(this.CreateChannel("Taler"), this.CreateChannel("Transkriptioner"));
	}

	public Initialize():void
	{
		this.AddTimeSegments();

		this.AdjustZoomLevelToFitLength();
		this.Subscribe(this.Length, () => this.AdjustZoomLevelToFitLength());
	}

	public CreateChannel(title:string):Channel
	{
		return {
			Title: title,
			Segments: this.CreateSegments(),
			TrackElement: knockout.observable(null)
		};
	}

	public CreateSegments():Segment[] {
		let segments:Segment[] = [];

		for (let i = 0; i < 1000; i++)
			segments.push(this.CreateSegment("Segment " + i, i * 80, i * 80 + 50));

		return segments;
	}

	public ZoomTracks(viewModel:any, event:JQueryMouseEventObject):void
	{
		let originalEvent = (<WheelEvent>(<any>event).originalEvent);

		this.ZoomLevel(this.ZoomLevel() * (originalEvent.deltaY > 0 ? 1.1 : 0.9));

		setTimeout(() => {
			if(this.TracksElement() != null && this.TracksElement().scrollLeft > this.TracksElement().scrollWidth - this.TracksElement().clientWidth)
			{
				this.TracksElement().scrollLeft = this.TracksElement().scrollWidth - this.TracksElement().clientWidth
			}
		});
	}

	private AddTimeSegments():void
	{
		this.TimeSegments.removeAll();

		for(let i = 0; i < this.Length(); i += 1000)
		{
			this.TimeSegments.push(this.CreateTimeSegment(i));
		}
	}

	private CreateTimeSegment(position:number):TimeSegment
	{
		return {
			Text: this.GetTimeCode(position),
			Position: position
		};
	}

	private CreateSegment(title:string, start:number, end:number):Segment
	{
		let result:Segment = {
			Title: title,
			Start: start,
			End: end,
			Length: end - start
		};

		return result;
	}

	private GetTimeCode(position: number):string
	{
		let hours = Math.floor(position / (60 * 60 * 1000));
		let minutes = Math.floor((position % (60 * 60 * 1000)) / (60 * 1000));
		let seconds = Math.floor((position % (60 * 1000)) / 1000);
		let milliseconds = position % 1000;

		return `${hours}:${this.ToTwoDigits(minutes)}:${this.ToTwoDigits(seconds)}.${milliseconds}`;
	}

	private ToTwoDigits(value:number):string
	{
		return value < 10 ? "0" + value : value.toString();
	}

	private AdjustZoomLevelToFitLength():void
	{
		if(this.TracksElement() == null) return;

		this.TracksElement().scrollLeft = 0;
		this.ZoomLevel(this.TracksElement().clientWidth / this.Length());
	}
}