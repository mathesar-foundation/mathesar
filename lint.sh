#!/usr/bin/env bash
set -uo pipefail

# This script runs appropriate linters for all the different codebases present
# in the repository and collates their return statuses.
#
# | Language | Linter | Directory    |
# |==========|========|==============|
# | Python   | Flake8 | .            |
# | Node.js  | ESLint | mathesar_ui/ |

# Formatting sequences
bold=$(tput bold)
normal=$(tput sgr0)

red="\e[31m"
green="\e[32m"
yellow="\e[33m"
endcol="\e[0m"

indent() { sed 's/^/│  /'; } # Indents piped output with a indent guide lines

# Run switches
RUN_PYTHON="false"
CHANGED_NON_NODE_FILES=$(git diff --name-only --staged -- . :^mathesar_ui)
if [[ $CHANGED_NON_NODE_FILES != "" ]]; then
	RUN_PYTHON="false"
fi

RUN_NODE="false"
CHANGED_NODE_FILES=$(git diff --name-only --staged mathesar_ui/)
if [[ $CHANGED_NODE_FILES == *"mathesar_ui/"* ]]; then
	RUN_NODE="true"
fi

# Argument parsing
while getopts "p:n:" opt; do
	case ${opt} in
		p)
			# Set whether to run or skip the linter for Python
			RUN_PYTHON=${OPTARG}
			;;
		n)
			# Set whether to run or skip the linter for Node.js
			RUN_NODE=${OPTARG}
			;;
		[?])
			printf "${bold}Bad command:${normal} You passed an invalid flag\n"
			printf "${bold}Options:${normal} [-p <True|false>] [-n <True|false>]\n"
			;;
	esac
done
shift $((OPTIND -1))

printf "${bold}Enabled:${normal}\n"
printf " Python? ${RUN_PYTHON}\n"
printf "Node.js? ${RUN_NODE}\n"

# Lint Python
if [[ $RUN_PYTHON != 'false' ]]; then
	printf "\nRunning ${bold}Flake8${normal} for Python...\n"
	flake8 . | indent

	PYTHON_EXIT=$?
	if [[ $PYTHON_EXIT -eq 0 ]]; then
		printf ${green}
	else
		printf ${red}
	fi
	printf "...done${endcol}\n"
else
	PYTHON_EXIT=0 # Assume checks passed if skipped
fi

# Lint Node.js
if [[ $RUN_NODE != 'false' ]]; then
	printf "\nRunning ${bold}ESLint${normal} for Node.js...\n"
	cd mathesar_ui && npm run lint | indent

	NODE_EXIT=$?
	if [[ $NODE_EXIT -eq 0 ]]; then
		printf ${green}
	else
		printf ${red}
	fi
	printf "...done${endcol}\n"
else
	NODE_EXIT=0 # Assume checks passed if skipped
fi

# Show lint report
printf "\n${bold}Report:${normal}\n"
printf " Python: "
if [[ $PYTHON_EXIT -ne 0 ]]; then
	printf "${red}failed"
elif [[ $RUN_PYTHON == "false" ]]; then
	printf "${yellow}skipped"
else
	printf "${green}passed"
fi
printf "${endcol}\n"

printf "Node.js: "
if [[ $NODE_EXIT -ne 0 ]]; then
	printf "${red}failed"
elif [[ $RUN_NODE == "false" ]]; then
	printf "${yellow}skipped"
else
	printf "${green}passed"
fi
printf "${endcol}\n"

# Collate exit statuses
printf "\n"
if [[ $PYTHON_EXIT -eq 0 && $NODE_EXIT -eq 0 ]]; then
	printf "${green}:) No lint problems!${endcol}\n"
	exit 0
else
	printf "${red}:'( Lint checks failed.${endcol}\n"
	exit 1
fi
