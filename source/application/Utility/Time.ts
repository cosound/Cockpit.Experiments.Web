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

	public static ToPrettyTimeFromMilliseconds(milliseconds: number): string
	{
		let date = new Date(milliseconds);
		return `${this.GetTwoDigits(date.getUTCHours() + (date.getUTCDate() - 1) * 24) }:${this.GetTwoDigits(date.getUTCMinutes()) }:${this.GetTwoDigits(date.getUTCSeconds()) }`;
	}

	public static ToMillisecondsFromPrettyTime(value: string): number
	{
		const result = /(\d\d):(\d\d):(\d\d\.?\d*)/.exec(value);

		if(result == null)
			return 0;

		return ((parseInt(result[1]) * 60 + parseInt(result[2])) * 60 + parseFloat(result[3])) * 1000;
	}

	public static GetTwoDigits(value: number): string
	{
		return value < 10 ? "0" + value : value.toString();
	}
}