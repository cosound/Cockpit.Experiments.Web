﻿import ExperimentManager = require("Managers/Portal/Experiment");
import QuestionBase = require("Components/Questions/QuestionBase");
import QuestionModel = require("Models/Question");

class EndOfExperiment extends QuestionBase<any>
{
	constructor(question: QuestionModel)
	{
		super(question, false);

		ExperimentManager.ExperimentCompleted();
	}
}

export = EndOfExperiment;