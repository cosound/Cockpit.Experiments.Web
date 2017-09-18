import knockout = require("knockout");
import moment = require("moment");
import {DataSet, DataItem, Timeline, TimelineOptions, DataGroup} from "vis";
import DisposableComponent = require("Components/DisposableComponent");
import CockpitPortal = require("Managers/Portal/Cockpit");
import MetadataExtractor from "Components/Questions/AudioInformationRetrieval/MetadataExtractor";
import Notification = require("Managers/Notification");

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
	public SelectedSegmentIndex:KnockoutComputed<number|null>;

	private _timeLine:Timeline|null = null;
	private _options:TimelineOptions|null = null;
	private _data:DataSet<DataItem>|null = null;
	private _groups:DataGroup[] = [];
	private _configuration:TimeLineConfiguration;
	private _segments = knockout.observableArray<CockpitPortal.IAudioInformationSegment>();

	constructor(private position: KnockoutComputed<number>, private duration: KnockoutComputed<number>, configuration: TimeLineConfiguration, private metadataExtractor: MetadataExtractor, private selectedSegment:KnockoutObservable<CockpitPortal.IAudioInformationSegment>)
	{
		super();

		this._data = new DataSet([],{});
		this._configuration = configuration;
		this.Header = this._configuration.Header;
		this.SelectedSegmentIndex = this.PureComputed(() => this._segments() != null ? this._segments().indexOf(selectedSegment()) : null);
		this.InitializeOptions();
		this.InitializeDuration();

		this.SubscribeUntilChange(this.Element, () => this.Initialize());
	}

	public LoadData(segments:CockpitPortal.IAudioInformationSegment[]):void
	{
		this._data.clear();
		this._segments.removeAll();
		this._segments.push(...segments);

		this._data.add(segments.map((s, i) => this.CreateSegment(s, i)));

		this.UpdateGroups();
	}

	private CreateSegment(data:CockpitPortal.IAudioInformationSegment, id:number):DataItem
	{
		return {
			id: id,
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
			if (e.items.length === 1)
				this.selectedSegment(this._segments()[e.items[0]]);
			else
				this.selectedSegment(null);
		});

		this.Subscribe(this.SelectedSegmentIndex, s => this._timeLine.setSelection(s));
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
	}

	private UpdateDuration():void
	{
		this._options.max = this.duration();
		this._options.end = this.duration();
		this._timeLine.setOptions(this._options);
	}
}