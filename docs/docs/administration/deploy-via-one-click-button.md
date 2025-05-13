# Depoy via One-Click Button

Mathesar can be deployed to various cloud providers with just a single click, making it easy to evaluate or start using the platform without complex infrastructure setup.

## Quick Deployment Options

The following deployment methods are available through [DeployStack.io](https://deploystack.io):

- **AWS CloudFormation**: Deploy to Amazon Web Services using CloudFormation
- **DigitalOcean App Platform**: Deploy to DigitalOcean's managed application platform
- **Render**: Deploy to Render.com's cloud platform
- **Helm Chart**: Deploy to any Kubernetes cluster using Helm

Each deployment option:
- Creates a ready to use Mathesar instance
- Includes all necessary infrastructure components
- Uses the official Mathesar Docker image
- Can be customized after deployment

Simply click the button for your preferred cloud provider below, or use the Helm commands if you're deploying to Kubernetes:

| Cloud Provider | Deploy Button |
|----------------|---------------|
| AWS | <a href="https://deploystack.io/deploy/mathesar-foundation-mathesar?provider=aws&language=cfn"><img src="https://raw.githubusercontent.com/deploystackio/deploy-templates/refs/heads/main/.assets/img/aws.svg" height="38"></a> |
| DigitalOcean | <a href="https://deploystack.io/deploy/mathesar-foundation-mathesar?provider=do&language=dop"><img src="https://raw.githubusercontent.com/deploystackio/deploy-templates/refs/heads/main/.assets/img/do.svg" height="38"></a> |
| Render | <a href="https://deploystack.io/deploy/mathesar-foundation-mathesar?provider=rnd&language=rnd"><img src="https://raw.githubusercontent.com/deploystackio/deploy-templates/refs/heads/main/.assets/img/rnd.svg" height="38"></a> |
| Helm | `helm repo add deploystack https://deploystackio.github.io/deploy-templates/`<br>`helm repo update`<br>`helm install mathesar-foundation-mathesar deploystack/mathesar-foundation-mathesar` |
