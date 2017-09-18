import DisposableComponent = require("Components/DisposableComponent");

export default class AudioInformationComponent extends DisposableComponent
{
	public IsVisible:boolean;

	constructor(protected data:any)
	{
		super();
		this.IsVisible = data.Enabled === "True";
	}
}