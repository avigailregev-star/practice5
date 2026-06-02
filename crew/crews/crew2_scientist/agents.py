from crewai import Agent
from tools.model_tools import train_and_save_model_tool


def feature_engineer_agent() -> Agent:
    return Agent(
        role="Feature Engineer",
        goal="Confirm which features will be used for training based on the dataset contract",
        backstory=(
            "You are an ML engineer who reads dataset contracts and prepares "
            "a clear feature list before model training begins."
        ),
        tools=[],
        verbose=True,
        allow_delegation=False,
    )


def model_trainer_agent() -> Agent:
    return Agent(
        role="Model Trainer",
        goal="Train Decision Tree and Random Forest classifiers and save the best model as model.pkl",
        backstory=(
            "You are a machine learning specialist who trains and compares classifiers "
            "for music education systems, choosing the model with the highest accuracy."
        ),
        tools=[train_and_save_model_tool],
        verbose=True,
        allow_delegation=False,
    )


def evaluator_agent() -> Agent:
    return Agent(
        role="Model Evaluator",
        goal="Summarize model performance for music teachers in clear Hebrew",
        backstory=(
            "You produce clear ML evaluation summaries for non-technical stakeholders "
            "like music teachers and school administrators."
        ),
        tools=[],
        verbose=True,
        allow_delegation=False,
    )
