import moment = require("moment");

export default class Time
{
	public static ToPrettyTimeFromString(value:string):string
	{
		return /\d\d\d\d-\d\d-\d\dT(\d\d:\d\d:\d\d)Z/.exec(value)[1];
	}

	public static ToPrettyTime(value:Date):string
	{
		return moment(value).format("HH:mm:SS")
	}
}