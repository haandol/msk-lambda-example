import * as cdk from '@aws-cdk/core';
import * as msk from '@aws-cdk/aws-msk';
import * as lambda from '@aws-cdk/aws-lambda';
import * as eventSource from '@aws-cdk/aws-lambda-event-sources';

export interface MskEventSourceProps extends eventSource.StreamEventSourceProps {
}

/**
 * Use an Amazon Msk stream as an event source for AWS Lambda.
 */
export class MskEventSource extends eventSource.StreamEventSource {
  private _eventSourceMappingId?: string = undefined;

  constructor(readonly cluster: msk.CfnCluster, props: MskEventSourceProps) {
    super(props);

    this.props.batchSize !== undefined && cdk.withResolved(this.props.batchSize, batchSize => {
      if (batchSize < 1 || batchSize > 10000) {
        throw new Error(`Maximum batch size must be between 1 and 10000 inclusive (given ${this.props.batchSize})`);
      }
    });
  }

  public bind(target: lambda.IFunction) {
    const eventSourceMapping = target.addEventSourceMapping(`MskEventSource:${this.cluster.node.uniqueId}`,
      this.enrichMappingOptions({eventSourceArn: this.cluster.ref}),
    );
    this._eventSourceMappingId = eventSourceMapping.eventSourceMappingId;
  }

  /**
   * The identifier for this EventSourceMapping
   */
  public get eventSourceMappingId(): string {
    if (!this._eventSourceMappingId) {
      throw new Error('MskEventSource is not yet bound to an event source mapping');
    }
    return this._eventSourceMappingId;
  }
}