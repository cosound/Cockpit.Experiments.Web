﻿import PortalClient = require("PortalClient");
import Configuration = require("Managers/Configuration");

export class Experiment
{
	public static Get(id: string, serviceCaller: CHAOS.Portal.Client.IServiceCaller = null):CHAOS.Portal.Client.ICallState<CockpitResults<IExperiment>>
	{
		if (serviceCaller == null)
			serviceCaller = PortalClient.ServiceCallerService.GetDefaultCaller();

		return serviceCaller.CallService("Experiment/Get", PortalClient.HttpMethod.Get, { id: id }, false);
	}

	public static Next(listId: string, serviceCaller: CHAOS.Portal.Client.IServiceCaller = null): CHAOS.Portal.Client.ICallState<CockpitResults<IExperimentClaim>>
	{
		if (serviceCaller == null)
			serviceCaller = PortalClient.ServiceCallerService.GetDefaultCaller();

		return serviceCaller.CallService("Experiment/Next", PortalClient.HttpMethod.Get, { listId: listId }, false);
	}
}

export class Slide
{
	public static Completed(questionaireId: string, slideIndex: number, serviceCaller: CHAOS.Portal.Client.IServiceCaller = null): CHAOS.Portal.Client.ICallState<CockpitResults<any>>
	{
		if (serviceCaller == null)
			serviceCaller = PortalClient.ServiceCallerService.GetDefaultCaller();

		return serviceCaller.CallService("Slide/Completed", PortalClient.HttpMethod.Get, { questionaireId: questionaireId, slideIndex: slideIndex }, false);
	}
}

export class Question
{
	public static Get(id: string, index: number, serviceCaller: CHAOS.Portal.Client.IServiceCaller = null): CHAOS.Portal.Client.ICallState<CockpitResults<IQuestion>>
	{
		if (serviceCaller == null)
			serviceCaller = PortalClient.ServiceCallerService.GetDefaultCaller();

		return serviceCaller.CallService("Question/Get", PortalClient.HttpMethod.Get, { id: id, index: index}, false, "json3");
	}
}

export class Answer
{
	public static Set(questionId: string, output: any, serviceCaller: CHAOS.Portal.Client.IServiceCaller = null): CHAOS.Portal.Client.ICallState<CHAOS.Portal.Client.IPagedPortalResult<any>>
	{
		if (serviceCaller == null)
			serviceCaller = PortalClient.ServiceCallerService.GetDefaultCaller();

		return serviceCaller.CallService("Answer/Set", PortalClient.HttpMethod.Post, { questionId: questionId, output: JSON.stringify(output) }, false);
	}
}

export class AudioInformation
{
	public static Search(argumentsValue:string, functionValue:string, serviceCaller: CHAOS.Portal.Client.IServiceCaller = null): CHAOS.Portal.Client.ICallState<CHAOS.Portal.Client.IPagedPortalResult<IAudioInformation>>
	{
		if (serviceCaller == null)
			serviceCaller = PortalClient.ServiceCallerService.GetDefaultCaller();

		return serviceCaller.CallService("AudioInformation/Search", PortalClient.HttpMethod.Get, {"arguments": argumentsValue, "function": functionValue}, false);
	}
}

export interface IAudioInformation
{
	Id: string;
	Index: string;
	Stimulus: IAudioInformationStimulus;
	Metadata: IAudioInformationMetadata;
	Segments: IAudioInformationSegment[];
}

export interface IAudioInformationStimulus
{
	URI: string;
}

export interface IAudioInformationMetadata
{
	SchemaId: string;
	Fields: {[key:string]: {Value:string}};
}

export interface IAudioInformationSegment
{
	Id?:string;
	CaterogyId : string;
	StartTime: string;
	EndTime: string;
	ColorGroup: string;
	Metadata: IAudioInformationMetadata;
}

export interface IExperiment
{
	Id: string;
	Name: string;
	FooterLabel: string;
	Css: string;
	Version: string;
	LockQuestion:boolean;
	EnablePrevious: boolean;
	CurrentSlideIndex: number;
	RedirectOnCloseUrl:string;
}

export interface IExperimentClaim
{
	Id: string;
	ClaimedOnDate:string;
}

export interface CockpitResults<T>
{
	Count:number;
	FoundCount:number;
	StartIndex: number;
	Results: T[];
}

export interface IQuestion
{
	Id:string;
	Type: string;
	Input:any[];
	Output: IOutput;
}

export interface IOutput
{
	Events:IQuestionEvent[];
}

export interface IQuestionEvent
{
	Id: string;
	Type: string;
	Method: string;
	Data: string;
	DateTime:Date;
}