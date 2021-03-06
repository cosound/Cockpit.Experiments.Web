﻿class NameConventionLoader implements KnockoutComponentTypes.Loader
{
	public getConfig(componentName:string, callback:(result:KnockoutComponentTypes.ComponentConfig) => void):void
	{
		var filePath = NameConventionLoader.GetFilePath(componentName);

		callback({
			viewModel: { require: filePath },
			template: { require: "text!" + filePath + ".html" }
		});
	}

	public static GetFilePath(name: string): string
	{
		var filePath = name + (name.lastIndexOf("/") === -1 ? `/${name}` : name.substring(name.lastIndexOf("/")));

		return "Components/" + filePath;
	}
}

export = NameConventionLoader;