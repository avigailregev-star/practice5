from crewai import Task


def clean_task(agent) -> Task:
    return Task(
        description=(
            "Clean the raw violin student data. "
            "Call clean_data_tool with input_path='data/raw_data.csv' and output_path='data/clean_data.csv'. "
            "Report how many rows were saved."
        ),
        expected_output="Confirmation that clean_data.csv was created with the number of rows.",
        agent=agent,
    )


def eda_task(agent) -> Task:
    return Task(
        description=(
            "Run exploratory data analysis on the clean violin data. "
            "Call run_eda_tool with clean_path='data/clean_data.csv' and output_dir='outputs'. "
            "Report which files were created."
        ),
        expected_output="Confirmation that eda_report.html and insights.md were created in outputs/.",
        agent=agent,
    )


def contract_task(agent) -> Task:
    return Task(
        description=(
            "Write the dataset contract for the ML team. "
            "Call write_contract_tool with clean_path='data/clean_data.csv' and output_dir='outputs'. "
            "Report the contract contents."
        ),
        expected_output="Confirmation that dataset_contract.json was written to outputs/.",
        agent=agent,
    )
