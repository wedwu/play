Here's the Mermaid code for that flowchart:

```mermaid
flowchart TD
    Users[Users] --> AFD["Azure Front Door<br/>(Global – survives regional outage)"]

    AFD -->|Primary| SPA1["App Service – East US<br/>Angular SPA"]
    AFD -->|Failover| SPA2["App Service – East US 2<br/>Angular SPA (Warm Standby)"]
    AFD -.->|Health Probe Fails East US| SPA2

    SPA1 --> CA1["Container Apps – East US<br/>CompAPI"]
    SPA2 --> CA2["Container Apps – East US 2<br/>CompAPI (Warm Standby)"]

    CA1 --> APIM["Azure APIM<br/>(route to upstream APIs)"]
    CA2 --> APIM

    APIM --> UP["Upstream APIs<br/>(Other Teams - external to your DR)"]
```

The dotted arrow (`-.->`) represents the health-probe failover path, matching the dashed line in your diagram. Paste it into mermaid.live (or any Mermaid renderer) and it'll render the same structure.


```mermaid
flowchart TD
    OUT[Full Azure Outage] --> AS["App Service DOWN<br/>Angular unavailable"]
    OUT --> CA["Container Apps DOWN<br/>CompAPI unavailable"]
    OUT --> APIM["APIM DOWN<br/>Gateway to upstream APIs unavailable"]
    OUT --> ADO["Azure DevOps DOWN<br/>Cannot re-deploy via pipelines"]

    PING[PingFederate / Okta] -->|Still UP – external| AUTH["Auth unaffected<br/>but app is unreachable anyway"]

    UP[Upstream APIs] -->|May still be UP| UNREACH["Unreachable – APIM<br/>is the broken link"]
```

Same structure as the image: the outage node fans out to the four DOWN boxes, with PingFederate/Okta and Upstream APIs as separate standalone chains on the right.