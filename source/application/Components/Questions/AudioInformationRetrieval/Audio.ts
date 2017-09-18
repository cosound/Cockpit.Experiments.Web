import knockout = require("knockout");
import WayfAuthenticator from "Components/Questions/AudioInformationRetrieval/WayfAuthenticator";
import AudioInformationComponent from "Components/Questions/AudioInformationRetrieval/AudioInformationComponent";
import AudioPlayer from "Utility/Audio";
import Time from "Utility/Time";

export default class Audio extends AudioInformationComponent
{
	public Position:KnockoutComputed<number>;
	public Duration:KnockoutComputed<number>;
	public IsPlaying:KnockoutComputed<boolean>;

	public PrettyPosition:KnockoutComputed<string>;
	public PrettyDuration:KnockoutComputed<string>;

	public Audio = knockout.observable<AudioPlayer>();

	constructor(data:any, private wayfAuthenticator:WayfAuthenticator)
	{
		super(data);

		this.Position = this.PureComputed(() => this.Audio() != null ? this.Audio().Position() : 0, v => {
			if(this.Audio() != null)
				this.Audio().Position(v);
		});
		this.Duration = this.PureComputed(() => this.Audio() != null ? this.Audio().Duration() : 0);
		this.IsPlaying = this.PureComputed(() => this.Audio() != null ? this.Audio().IsPlaying() : false);
		this.PrettyPosition = knockout.pureComputed(() => Time.ToPrettyTimeFromMilliseconds(this.Position()));
		this.PrettyDuration = knockout.pureComputed(() => Time.ToPrettyTimeFromMilliseconds(this.Duration()));
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