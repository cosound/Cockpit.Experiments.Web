import knockout = require("knockout");
import WayfAuthenticator from "Components/Questions/AudioInformationRetrieval/WayfAuthenticator";
import DisposableComponent = require("Components/DisposableComponent");
import AudioPlayer from "Utility/Audio";
import Time from "Utility/Time";

export default class Audio extends DisposableComponent
{
	public Position:KnockoutComputed<number>;
	public Duration:KnockoutComputed<number>;

	public PrettyPosition:KnockoutComputed<string>;
	public PrettyDuration:KnockoutComputed<string>;

	public Audio = knockout.observable<AudioPlayer>();

	constructor(private wayfAuthenticator:WayfAuthenticator)
	{
		super();

		this.Position = this.PureComputed(() => this.Audio() != null ? this.Audio().Position() : 0, v => {
			if(this.Audio() != null)
				this.Audio().Position(v);
		});
		this.Duration = this.PureComputed(() => this.Audio() != null ? this.Audio().Duration() : 0);
		this.PrettyPosition = knockout.pureComputed(() => Time.ToPrettyTimeFromMillieseconds(this.Position()));
		this.PrettyDuration = knockout.pureComputed(() => Time.ToPrettyTimeFromMillieseconds(this.Duration()));
	}

	public Load(assetGuid:string):void
	{
		this.wayfAuthenticator.GetAsset(assetGuid, asset => {
			if(this.Audio() != null)
				this.Audio().Dispose();

			this.Audio(new AudioPlayer(asset.Files[0].Destinations[0].Url));
			this.Audio().Volume(10);

			this.AddAction(this.Audio().IsReady, () => {
				this.Audio().Play();
			});
		});
	}
}