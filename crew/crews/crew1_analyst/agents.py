from crewai import Agent
from tools.data_tools import clean_data_tool, run_eda_tool, write_contract_tool


def data_cleaner_agent() -> Agent:
    return Agent(
        role="Data Cleaner",
        goal="Clean the raw violin student dataset and save clean_data.csv",
        backstory=(
            "You are an expert data engineer specializing in music education data. "
            "You ensure datasets are clean, consistent, and ready for analysis."
        ),
        tools=[clean_data_tool],
        verbose=True,
        allow_delegation=False,
    )


def eda_analyst_agent() -> Agent:
    return Agent(
        role="EDA Analyst",
        goal="Analyze violin student data and produce a visual HTML report with Hebrew insights",
        backstory=(
            "You are a data analyst specializing in music education research. "
            "You produce clear, visual reports that help music teachers understand their students."
        ),
        tools=[run_eda_tool],
        verbose=True,
        allow_delegation=False,
    )


def contract_agent() -> Agent:
    return Agent(
        role="Data Contract Agent",
        goal="Define and write the dataset contract for handoff to the ML team",
        backstory=(
            "You ensure data handoffs between teams are clean and well-documented, "
            "so the ML team always knows exactly which columns to use."
        ),
        tools=[write_contract_tool],
        verbose=True,
        allow_delegation=False,
    )
