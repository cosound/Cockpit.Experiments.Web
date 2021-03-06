import knockout = require("knockout");
import moment = require("moment");
import {DataSet, DataItem, Timeline, TimelineOptions, DataGroup} from "vis";
import AudioInformationComponent from "Components/Questions/AudioInformationRetrieval/AudioInformationComponent";
import CockpitPortal = require("Managers/Portal/Cockpit");
import MetadataExtractor from "Components/Questions/AudioInformationRetrieval/MetadataExtractor";
import Notification = require("Managers/Notification");

type TimeLineCategory = {
	Id:string,
	Header:string
}
type TimeLineConfiguration = {Header:string,
	Categories: {
	Category: TimeLineCategory|TimeLineCategory[]
}}

export default class TimeLineHandler extends AudioInformationComponent
{
	public Header:string = "";
	public Element = knockout.observable<HTMLElement|null>(null);
	public ViewPosition:KnockoutObservable<{start:number, end:number}>;

	private _timeLine:Timeline|null = null;
	private _options:TimelineOptions|null = null;
	private _data:DataSet<DataItem>|null = null;
	private _groups:DataGroup[] = [];
	private _configuration:TimeLineConfiguration;
	private _segments = knockout.observableArray<CockpitPortal.IAudioInformationSegment>();

	constructor(data:TimeLineConfiguration, private position: KnockoutComputed<number>, private duration: KnockoutComputed<number>, private metadataExtractor: MetadataExtractor, private selectedSegment:KnockoutObservable<CockpitPortal.IAudioInformationSegment>)
	{
		super(data);

		this.ViewPosition = knockout.observable(null).extend({rateLimit: 2000});

		if(this.IsVisible)
		{
			this._data = new DataSet([],{});
			this._configuration = data;
			this.Header = this._configuration.Header;
			this.InitializeOptions();
			this.InitializeDuration();

			this.SubscribeUntilChange(this.Element, () => this.Initialize());
		}
	}

	public LoadData(segments:CockpitPortal.IAudioInformationSegment[]):void
	{
		this._data.clear();
		this._segments.removeAll();
		this._segments.push(...segments);

		this._data.add(segments.map(s => this.CreateSegment(s)));

		this.UpdateGroups();
	}

	private CreateSegment(data:CockpitPortal.IAudioInformationSegment):DataItem
	{
		return {
			id: data.Id,
			start: moment("1970-01-01T" + data.StartTime + "Z"),
			end: moment("1970-01-01T" + data.EndTime + "Z"),
			content: this.metadataExtractor.GetHeader(data),
			group: data.CaterogyId,
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

				let groupConfig:TimeLineCategory;

				if(this._configuration.Categories.Category instanceof Array)
				{
					const groups = (this._configuration.Categories.Category as TimeLineCategory[]).filter(c => c.Id == data.group)

					if(groups.length != 0)
						groupConfig = groups[0];
				}
				else
				{
					groupConfig = this._configuration.Categories.Category as TimeLineCategory
				}

				if(!groupConfig)
					groupConfig = {Id: null, Header: "Gruppe"};

				this._groups.push({
					id: data.group,
					content: groupConfig.Header
				});
			});
		}

		if(this._timeLine != null)
			this._timeLine.setGroups(this._groups);
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

	private InitializeDuration():void
	{
		this.Subscribe(this.duration, () => {
			if(this._timeLine == null)
				this.Initialize();
			else
				this.UpdateDuration();
		});
	}

	private InitializeSelection():void
	{
		this._timeLine.on("select", (e) =>
		{
			console.log(e, this._segments());
			if (e.items.length === 1)
				this.selectedSegment(this._segments().filter(s => s.Id == e.items[0])[0]);
			else
				this.selectedSegment(null);
		});

		this.Subscribe(this.selectedSegment, s => this._timeLine.setSelection(s.Id));
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
			Notification.Error("Error creating timeline: " + error);
			return;
		}

		this.InitializePosition();
		this.InitializeSelection();
	}

	private InitializePosition()
	{
		this._timeLine.addCustomTime(0, "PlayerPosition");
		
		let isUpdatingPosition = false;
		let isDraggingTime = false;
		this.position.subscribe(v =>
		{
			if (isUpdatingPosition || isDraggingTime || v == null) return;
			isUpdatingPosition = true;
			this._timeLine.setCustomTime(v, "PlayerPosition");
			isUpdatingPosition = false;
		});
		this._timeLine.on("timechanged", e =>
		{
			isDraggingTime = false;
			if (isUpdatingPosition) return;
			isUpdatingPosition = true;
			this.position(e.time.getTime());
			isUpdatingPosition = false;
		});
		this._timeLine.on("timechange", e =>
		{
			isDraggingTime = true;
		});
		this._timeLine.on("rangechanged", e => {
			this.ViewPosition({start: e.start.getTime(), end: e.end.getTime()})
		});
	}

	private UpdateDuration():void
	{
		this._options.max = this.duration();
		this._options.end = this.duration();
		this._timeLine.setOptions(this._options);
	}
}