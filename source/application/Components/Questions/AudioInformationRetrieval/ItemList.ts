import knockout = require("knockout");
import CockpitPortal = require("Managers/Portal/Cockpit");
import AudioInformationComponent from "Components/Questions/AudioInformationRetrieval/AudioInformationComponent";
import Time from "Utility/Time";

type FieldData = {Value:string, IsPlayButton:boolean};
type ColumnData = {Header: string, Id: string|{"#text":string, "@Comment":string}, Type: string};
type SearchResult = {IsSelected:KnockoutComputed<boolean>, Select:()=>void, Data: CockpitPortal.IAudioInformation, Fields:FieldData[]}

export default class Search extends AudioInformationComponent
{
	public Results = knockout.observableArray<SearchResult>();
	public Selected = knockout.observable<SearchResult>();

	public HasResults:KnockoutComputed<boolean>;

	public Columns:ColumnData[];

	private static FieldMask = /\.\/.+?\/(.+)/;

	constructor(data:any, results:KnockoutObservable<CockpitPortal.IAudioInformation[]|null>, predefinedData:any|null)
	{
		super(data);

		this.Columns = data.Fields.Field;

		if(predefinedData != null && predefinedData.Items && predefinedData.Items.Item && predefinedData.Items.Item.length > 0)
		{
			this.Results(predefinedData.Items.Item.map((item:CockpitPortal.IAudioInformation, index:number) => this.CreateSearchResult(this.ConvertData(item), index)));
		}

		this.HasResults = this.PureComputed(() => this.Results().length > 0);

		this.Subscribe(results, r => {
			this.Results.removeAll();
			this.Results.push(...r.map((item, index) => this.CreateSearchResult(item, index)));
		})
	}

	private ConvertData(data:any):any
	{
		data.Metadata = this.ConvertFields(data.Metadata);
		data.Segments = data.Segments.Segment.map((s:any) => {
			s.Metadata = this.ConvertFields(s.Metadata);
			return s;
		});

		return data;
	}

	private ConvertFields(data:any):any
	{
		if(data.hasOwnProperty("Fields"))
			return data;

		const newData:any = {SchemaId: "", Fields:{}};

		if(data.hasOwnProperty("@SchemaId"))
			newData.SchemaId = data["@SchemaId"];

		for(let key in data)
		{
			if(!data.hasOwnProperty(key))
				continue;

			let value = data[key];
			if(key == "@SchemaId")
				newData.SchemaId = value;
			else if(value.hasOwnProperty("Value"))
				newData.Fields[key] = value;
			else if(value.hasOwnProperty("#text"))
				newData.Fields[key] = {Value: value["#text"]};
			else
				throw new Error("Failed to convert fields: " + JSON.stringify(value));
		}

		return newData;
	}

	private CreateSearchResult(result:CockpitPortal.IAudioInformation, index:number):SearchResult
	{
		let item:SearchResult = {
			IsSelected: null,
			Select: null,
			Data: result,
			Fields: this.Columns.map(c => this.CreateField(result, index, c))
		};

		item.IsSelected = this.PureComputed(() => this.Selected() == item);
		item.Select = () => this.Selected(item);
		return item;
	}

	private CreateField(result:CockpitPortal.IAudioInformation, index:number, column:ColumnData):FieldData
	{
		if(typeof column.Id ==  "string")
		{
			const fieldsName = Search.FieldMask.exec(column.Id as string);

			if(fieldsName == null)
				throw new Error("Failed to read column: " + JSON.stringify(column));

			if(!result.Metadata.Fields.hasOwnProperty(fieldsName[1]))
			{
				console.log("Failed to find field for: " + JSON.stringify(column))

				return {Value: "N/A", IsPlayButton: false};
			}

			return {Value: result.Metadata.Fields[fieldsName[1]].Value, IsPlayButton: false};
		}
		else
		{
			if(column.Type == "AudioPlayer")
				return {Value: null, IsPlayButton: true};
			else if(column.Id["#text"].indexOf("Index") != -1)
				return {Value: (index + 1).toString(), IsPlayButton: false};
			else
				return {Value: "N/A", IsPlayButton: false};
		}
	}
}