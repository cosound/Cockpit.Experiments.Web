import knockout = require("knockout");
import {DataSet, DataItem, Timeline, TimelineOptions} from "vis";
import DisposableComponent = require("Components/DisposableComponent");

export default class TimeLineHandler extends DisposableComponent
{
	public Element = knockout.observable<HTMLElement|null>(null);

	private _timeLine:Timeline|null = null;
	private _options:TimelineOptions|null = null;
	private _data:DataSet<DataItem>|null = null;

	constructor(private position:KnockoutComputed<number>, private duration:KnockoutComputed<number>)
	{
		super();

		this._data = new DataSet([],{});
		this.InitializeOptions();

		this.SubscribeUntilChange(this.Element, () => this.Initialize());
		this.Subscribe(this.duration, () => {
			if(this._timeLine == null)
				this.Initialize();
			else
				this.UpdateDuration();
		});
	}

	public LoadData(segments:any[]):void
	{
		this._data.clear();

		this._data.add(segments.map(s => this.CreateSegment(s)));
	}

	private CreateSegment(data:any):DataItem
	{
		return {
			start: data.StartTime,
			end: data.EndTime,
			content: this.GetContent(data)
		}
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

	private InitializeOptions():void
	{
		this._options = {
			min: 0,
			max: this.duration(),
			showCurrentTime: false,
			showMajorLabels: false,
			format: {
				minorLabels: {
					millisecond: "mm:ss.S",
					second: "mm:ss",
					minute: "mm:ss",
					hour: "HH:mm",
					weekday: "HH:mm",
					day: "HH:mm",
					month: "HH:mm",
					year: "HH:mm"
				}
			}
		};
	}

	private Initialize():void
	{
		if(this.Element() == null || this.duration() == 0)
			return;

		console.log("Test")

		this._options.max = this.duration();

		this._timeLine = new Timeline(this.Element(), this._data, this._options);

		this._timeLine.addCustomTime(0, "PlayerPosition");
		this.position.subscribe(v =>
		{
			this._timeLine.setCustomTime(v, "PlayerPosition");
		});
	}

	private UpdateDuration():void
	{
		this._options.max = this.duration();
		this._timeLine.setOptions(this._options)
	}
}