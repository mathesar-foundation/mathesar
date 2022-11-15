# You can set these variables from the command line, and also
# from the environment for the first two.
INITSCRIPT = initial_setup.sh

# Initial setup
initial_setup:
	@bash "$(INITSCRIPT)"

.PHONY: initial_setup
