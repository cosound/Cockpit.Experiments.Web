import knockout = require("knockout");
import moment = require("moment");
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
			start: moment("1970-01-01T" + data.StartTime + "Z"),
			end: moment("1970-01-01T" + data.EndTime + "Z"),
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
			max: 60 * 60 * 30,
			start: 0,
			end: 60 * 60 * 30,
			showCurrentTime: false,
			showMajorLabels: false,
			snap: null,
			moment: (date: Date) => moment(date).utc(),
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

		this._options.max = this.duration();
		this._options.end = this.duration();

		try {
			this._timeLine = new Timeline(this.Element(), this._data, this._options);
		}
		catch (error)
		{
			console.log(error)
		}

		this._timeLine.addCustomTime(0, "PlayerPosition");
		this.position.subscribe(v =>
		{
			this._timeLine.setCustomTime(v, "PlayerPosition");
		});
	}

	private UpdateDuration():void
	{
		this._options.max = this.duration();
		this._options.end = this.duration();
		this._timeLine.setOptions(this._options)
	}
}