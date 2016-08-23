import knockout = require("knockout");
import QuestionBase = require("Components/Questions/QuestionBase");
import QuestionModel = require("Models/Question");
import AudioInfo = require("Components/Players/Audio/AudioInfo");

type Selection = {Identifier:string};

type Segment = {Title:string, Start:number, End:number, Length:number};
type Channel = {Title:string, Segments:Segment[]};

class AudioInformationRetrieval extends QuestionBase<{Selections:Selection[]}>
{
	public SearchViewHeader = knockout.observable("");
	public SearchViewButtonLabel = knockout.observable("");
	public ZoomLevel = knockout.observable(1);

	public Channels = knockout.observableArray<Channel>();

	constructor(question: QuestionModel)
	{
		super(question);

		var searchView = this.GetInstrument("SearchView");

		this.SearchViewHeader(searchView["Header"]["Label"]);
		this.SearchViewButtonLabel(searchView["Button"]["Label"]);

		this.Channels.push(this.CreateChannel("Taler"), this.CreateChannel("Transkriptioner"))
	}

	public Search():void
	{

	}

	public CreateChannel(title:string):Channel
	{
		return {
			Title: title,
			Segments: this.CreateSegments()
		};
	}
	
	public CreateSegments():Segment[] {
		var segments:Segment[] = [];

		for (let i = 0; i < 1000; i++)
			segments.push(this.CreateSegment("Segment " + i, i * 80, i * 80 + 50));

		return segments;
	}

	public ZoomTracks(viewModel:any, event:JQueryMouseEventObject):void
	{
		var originalEvent = (<WheelEvent>(<any>event).originalEvent);

		this.ZoomLevel(this.ZoomLevel() + (originalEvent.deltaY > 0 ? 0.1 : -.1));
	}

	private CreateSegment(title:string, start:number, end:number):Segment
	{
		return {
			Title: title,
			Start: start,
			End: end,
			Length: end - start
		};
	}
}

export  = AudioInformationRetrieval;