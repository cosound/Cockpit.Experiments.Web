﻿import knockout = require("knockout");
import CockpitPortal = require("Managers/Portal/Cockpit");

class Slide
{
	public Index:number;
	public Name: string;
	public IsWorking:KnockoutComputed<boolean>;
	public CanGoToNextSlide:KnockoutObservable<boolean>;
	public Questions:CockpitPortal.IQuestion[];
	public SlideCompleted: (waitForSave:boolean, completed: () => void) => void;
	public ScrollToFirstInvalidAnswerCallback: () => void;

	private _isWorking:KnockoutObservable<KnockoutComputed<boolean>> = knockout.observable(null);

	constructor(name: string, index: number = null, canGoToNextSlide: KnockoutObservable<boolean> = null, questions:CockpitPortal.IQuestion[] = null)
	{
		this.Index = index;
		this.Name = name;
		this.CanGoToNextSlide = canGoToNextSlide;
		this.Questions = questions;
		this.IsWorking = knockout.computed(() => this._isWorking() != null ? this._isWorking()() : false);
	}

	public Complete(waitForSave:boolean, callback:()=>void):void
	{
		if (this.SlideCompleted != null) this.SlideCompleted(waitForSave, callback);
	}

	public ScrollToFirstInvalidAnswer():void
	{
		if (this.ScrollToFirstInvalidAnswerCallback != null) this.ScrollToFirstInvalidAnswerCallback();
	}

	public SetIsWorking(observeable: KnockoutComputed<boolean>): void
	{
		this._isWorking(observeable);
	}
}

export = Slide;