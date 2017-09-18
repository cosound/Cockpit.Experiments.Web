import CockpitPortal = require("Managers/Portal/Cockpit");
import Notification = require("Managers/Notification");

type MetadataSchema = {"@HeaderField":string, "@Id":string};
type Field = {Key:string, Value:string};

export default class MetadataExtractor
{
	private _data:MetadataSchema[];

	constructor(data:MetadataSchema[])
	{
		this._data = data;
	}

	public GetHeader(segment:CockpitPortal.IAudioInformationSegment):string
	{
		const headerName = this.GetHeaderName(segment.Metadata.SchemaId);

		if(headerName == null)
		{
			Notification.Error(`Schema with id ${segment.Metadata.SchemaId} not found`);
			return this.GetFirstValue(segment);
		}
		if(!segment.Metadata.Fields.hasOwnProperty(headerName.slice(1)))
		{
			Notification.Error(`Could not find header with name ${headerName}`);
			return this.GetFirstValue(segment);
		}

		return segment.Metadata.Fields[headerName.slice(1)].Value;
	}

	public GetNoneHeaders(segment:CockpitPortal.IAudioInformationSegment):Field[]
	{
		let headerName = this.GetHeaderName(segment.Metadata.SchemaId);

		if(headerName !== null)
			headerName = headerName.slice(1);

		let result:Field[] = [];

		for(let key in segment.Metadata.Fields)
		{
			if(!segment.Metadata.Fields.hasOwnProperty(key) || key == headerName)
				continue;

			result.push({Key: key, Value: segment.Metadata.Fields[key].Value});
		}

		return result;
	}

	private GetHeaderName(schemaId: string):string
	{
		const schema = this.GetSchema(schemaId);

		return schema != null ? schema["@HeaderField"] : null;
	}

	private GetSchema(schemaId: string):MetadataSchema
	{
		for(let i = 0; i < this._data.length; i++)
		{
			if(this._data[i]["@Id"] == schemaId)
				return this._data[i];
		}

		return null;
	}

	private GetFirstValue(segment:CockpitPortal.IAudioInformationSegment):string
	{
		for(let key in segment.Metadata.Fields)
		{
			if(segment.Metadata.Fields.hasOwnProperty(key) && segment.Metadata.Fields[key].Value)
				return segment.Metadata.Fields[key].Value;
		}

		return "No header";
	}
}