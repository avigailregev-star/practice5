from crewai import Crew, Process

from .agents import evaluator_agent, feature_engineer_agent, model_trainer_agent
from .tasks import eval_task, feature_task, train_task


class Crew2ScientistCrew:
    def kickoff(self):
        engineer = feature_engineer_agent()
        trainer = model_trainer_agent()
        evaluator = evaluator_agent()

        crew = Crew(
            agents=[engineer, trainer, evaluator],
            tasks=[
                feature_task(engineer),
                train_task(trainer),
                eval_task(evaluator),
            ],
            process=Process.sequential,
            verbose=True,
        )
        return crew.kickoff()
