# Setup for Windows

If you're installing Mathesar on Windows, here's a guide to setting up the pre-requisites, written by one of our testers:

- Download and then run the Docker Desktop (for Windows) installer found here:
https://docs.docker.com/desktop/install/windows-install/

- During the Docker installation, confirm the choice Use WSL 2 instead of Hyper-V option on the configuration page.  WSL is the Windows Sub System for Linux and is required to run Mathesar.

- After the Docker install finishes, open a DOS Command Prompt (from Windows) and enter and run the following command:
`C:\>wsl --update`

!!!note "Notes"
    - Depending on your permission, for this step and future steps, you may need to right-click the DOS Command Prompt menu choice and select Run as Administrator to elevate the prompts permissions.
    - `update` is prefaced by two hyphen characters

- Restart the PC after the WSL update finishes.

- Open a new DOS Command Prompt and enter and run the following command to install Ubuntu (the default distribution for WSL): `C:\> wsl --install -d Ubuntu`

!!!note "Notes"
    - `install` is prefaced by two hyphen characters
    - During the installation you will need to provide an Ubuntu administrator name and password.  It is common to use `ubuntu` for both. Remember both as the Mathesar installer will need them. 

- At the same DOS Command Prompt enter and run this command to verify the versions of all of the WSL containers:
`C:/ wsl -l -v`

!!!note
    Older versions of Windows may install/activate WSL 1 as part of the Docker install and Mathesar requires WSL 2.  If the results of this command show any WSL 1 containers, [follow the instructions here](https://learn.microsoft.com/en-us/windows/wsl/install#upgrade-version-from-wsl-1-to-wsl-2) to upgrade them to WSL 2.

- Reboot the PC.

- Locate the newly installed WSL/Ubuntu “app” on the Windows Start menu or by searching for “Ubuntu” using Windows Search, double-click to run/open it. 

- In the WSL/Ubuntu window enter and run these commands to confirm that the Docker and Docker Compose versions are at least 23 and 2.0 as required for the Mathesar installation:

`docker --version`

`docker compose version`

!!!note
    In the first command (only), version is prefixed by two hyphen characters

- In the same WSL/Ubuntu window, enter and run the installation command found in the [quickstart guide](./quickstart.md). This will start a script that will download Mathesar and setup the required Docker containers as described in the prior pages.
