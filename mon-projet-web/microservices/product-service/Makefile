VENV=.venv

install:
	python3 -m venv $(VENV)
	$(VENV)/bin/pip install -r requirements.txt

test:
	$(VENV)/bin/python -m unittest discover -s tests -v
