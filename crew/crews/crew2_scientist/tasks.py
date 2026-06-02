from crewai import Task


def feature_task(agent) -> Task:
    return Task(
        description=(
            "Read the dataset contract at 'outputs/dataset_contract.json'. "
            "List all feature columns and the target column that will be used for ML training."
        ),
        expected_output="A list of feature columns and the target column from the contract.",
        agent=agent,
    )


def train_task(agent) -> Task:
    return Task(
        description=(
            "Train the ML models and save the best one. "
            "Call train_and_save_model_tool with: "
            "clean_path='data/clean_data.csv', "
            "contract_path='outputs/dataset_contract.json', "
            "output_dir='outputs'. "
            "Report which model won and its accuracy."
        ),
        expected_output="Which model was saved to model.pkl and its accuracy score.",
        agent=agent,
    )


def eval_task(agent) -> Task:
    return Task(
        description=(
            "The files outputs/model_card.md and outputs/evaluation_report.md have been written. "
            "Read both and write a short Hebrew summary (3-5 bullet points) of the model's "
            "performance and the most important features for predicting violin difficulty."
        ),
        expected_output="A Hebrew bullet-point summary of model performance and key features.",
        agent=agent,
    )
