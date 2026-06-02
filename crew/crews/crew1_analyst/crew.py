from crewai import Crew, Process

from .agents import contract_agent, data_cleaner_agent, eda_analyst_agent
from .tasks import clean_task, contract_task, eda_task


class Crew1AnalystCrew:
    def kickoff(self):
        cleaner = data_cleaner_agent()
        analyst = eda_analyst_agent()
        contractor = contract_agent()

        crew = Crew(
            agents=[cleaner, analyst, contractor],
            tasks=[
                clean_task(cleaner),
                eda_task(analyst),
                contract_task(contractor),
            ],
            process=Process.sequential,
            verbose=True,
        )
        return crew.kickoff()
