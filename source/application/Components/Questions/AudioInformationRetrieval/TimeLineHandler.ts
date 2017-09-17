import knockout = require("knockout");
import moment = require("moment");
import {DataSet, DataItem, Timeline, TimelineOptions, DataGroup} from "vis";
import DisposableComponent = require("Components/DisposableComponent");
import CockpitPortal = require("Managers/Portal/Cockpit");

type TimeLineConfiguration = {Header:string,
	Categories: {
	Category: {
		Id:string,
		Header:string
	}[]
}}

export default class TimeLineHandler extends DisposableComponent
{
	public Header:string;
	public Element = knockout.observable<HTMLElement|null>(null);

	private _timeLine:Timeline|null = null;
	private _options:TimelineOptions|null = null;
	private _data:DataSet<DataItem>|null = null;
	private _groups:DataGroup[] = [];
	private _configuration:TimeLineConfiguration;

	constructor(private position:KnockoutComputed<number>, private duration:KnockoutComputed<number>, configuration:TimeLineConfiguration)
	{
		super();

		this._data = new DataSet([],{});
		this._configuration = configuration;
		this.Header = this._configuration.Header;
		this.InitializeOptions();

		this.SubscribeUntilChange(this.Element, () => this.Initialize());
		this.Subscribe(this.duration, () => {
			if(this._timeLine == null)
				this.Initialize();
			else
				this.UpdateDuration();
		});
	}

	public LoadData(segments:CockpitPortal.IAudioInformationSegment[]):void
	{
		this._data.clear();

		this._data.add(segments.map(s => this.CreateSegment(s)));

		this.UpdateGroups();
	}

	private CreateSegment(data:CockpitPortal.IAudioInformationSegment):DataItem
	{
		return {
			start: moment("1970-01-01T" + data.StartTime + "Z"),
			end: moment("1970-01-01T" + data.EndTime + "Z"),
			content: this.GetContent(data),
			group: data.CaterogyId
		}
	}

	private UpdateGroups():void
	{
		this._groups = [];

		if(this._data != null)
		{
			const groups:any = {};

			this._data.get().forEach(data => {
				if(groups.hasOwnProperty(data.group))
					return;

				groups[data.group] = true;

				const groupConfig = this._configuration.Categories.Category.filter(c => c.Id == data.group);

				this._groups.push({
					id: data.group,
					content: groupConfig.length != 0 ? groupConfig[0].Header : "Gruppe"
				});
			});
		}

		if(this._timeLine != null)
			this._timeLine.setGroups(this._groups);
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
			this._timeLine = new Timeline(this.Element(), this._data, this._groups, this._options);
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