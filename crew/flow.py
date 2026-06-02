from crewai.flow.flow import Flow, listen, start

from crews.crew1_analyst.crew import Crew1AnalystCrew
from crews.crew2_scientist.crew import Crew2ScientistCrew


class ViolinAnalysisFlow(Flow):
    @start()
    def run_analyst(self):
        print("\n🎻 Crew 1: Data Analyst — starting...\n")
        return Crew1AnalystCrew().kickoff()

    @listen(run_analyst)
    def run_scientist(self, analyst_output):
        print("\n🤖 Crew 2: Data Scientist — starting...\n")
        return Crew2ScientistCrew().kickoff()


def run_flow() -> None:
    flow = ViolinAnalysisFlow()
    flow.kickoff()
    print("\n✅ ניתוח הושלם! כל הקבצים נשמרו בתיקיית outputs/\n")


if __name__ == "__main__":
    run_flow()
