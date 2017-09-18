import knockout = require("knockout");
import DisposableComponent = require("Components/DisposableComponent");

type Item = { Label:string; Id:string; };

export default class Rating extends DisposableComponent
{
	public Header:string;
	public Name:string;
	public Items: Item[] = [];
	public Answer = knockout.observable<string>(null);
	public Selected = knockout.observable<string>(null);
	public CanAnswer = knockout.observable(true);

	constructor(data:any)
	{
		super();
		this.Name = new Date().getTime().toString();
		this.Header = data.Components.Heading;
		const items =  data.Components.Likert.Items.Item;

		for(let i = 0; i < items.length; i++)
		{
			if(!items[i].Id)
				items[i].Id = i.toString();

			this.Items.push(this.CreateItem(items[i]));
		}

	}

	public CreateItem(data:any):Item
	{
		return {
			Id: data.Id,
			Label: data.Label
		};
	}
}