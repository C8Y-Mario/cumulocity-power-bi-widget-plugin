/**
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {AlertService} from '@c8y/ngx-components';
import * as pbiClient from 'powerbi-client';
import {HttpService} from './http.service';
import {EmbeddingInfo} from './powerbi.interface';
import {PowerBIService} from './powerbi.service';
import {ConfigType} from "./gp-powerbi-config/gp-powerbi-config.component";

@Component({
  selector: 'gp-powerbi-widget',
  templateUrl: './gp-powerbi-widget.component.html',
  styles: [
  ]
})
export class GpPowerbiWidgetComponent implements OnInit, OnChanges {
  private powerbi = new pbiClient.service.Service(
    pbiClient.factories.hpmFactory,
    pbiClient.factories.wpmpFactory,
    pbiClient.factories.routerFactory
  );
  @ViewChild('reportContainer', { static: true }) reportContainer!: ElementRef;
  embeddingInfo?: EmbeddingInfo;
  reportName?: string;
  workspaceID?: string;
  reportID?: string;

  @Input() config!: ConfigType;
  embedUrl = 'https://app.powerbi.com/reportEmbed';
  embeddedReport: any;
  reportToDisplay?: { id: string; workspaceId: string; token: string; name: string; };

  constructor(
    private powerbiService: PowerBIService,
    private alertService: AlertService,
    private http: HttpService,
  ) {
  }
  // When changes are pushed from host component to report component, component is reinitialized to show a different report.
  // This may not be needed in customer scenario
  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes["embeddingInfo"] && changes["embeddingInfo"].currentValue) {
      await this.ngOnInit();
    }
  }
  async ngOnInit(): Promise<void> {
    try {
      if (this.config.embedEndPoint === null || this.config.embedEndPoint === undefined) {
        this.embedUrl = 'https://app.powerbi.com/reportEmbed';
      } else {
        this.embedUrl = this.config.embedEndPoint;
      }
      this.http.path = this.config.datahubEndPoint;
      this.powerbiService.path = this.config.powerBIEndPoint;
      await this.loadReport(this.config);
    } catch (e) {
      this.alertService.danger('Failed to load report.');
    }
    try {
      if (this.embeddingInfo) {
        this.embedReport(this.embeddingInfo.reportId, this.embeddingInfo.embeddingToken, this.config.isFilterPaneEnabled, this.config.isNavPaneEnabled);
      }
    } catch (e) {
      this.alertService.danger('Failed to fetch embedding token.');
    }
  }

  // This is where the Power BI client is actually used - parametrize the config however you like
  private embedReport(reportId: any, token: string, filterPaneEnabled: boolean, navPaneEnabled: boolean): any {
      const embedConfig: pbiClient.models.IReportEmbedConfiguration = {
        type: 'report',
        id: reportId,
        embedUrl: this.embedUrl,
        tokenType: pbiClient.models.TokenType.Embed,
        accessToken: token,
        // permissions: pbi.models.Permissions.Read,
        settings: {
          filterPaneEnabled: filterPaneEnabled,
          navContentPaneEnabled: navPaneEnabled,
          background: pbiClient.models.BackgroundType.Transparent
        }
      };
      const reportContainer = this.reportContainer.nativeElement;
      this.powerbi.reset(reportContainer);
      const report = this.powerbi.embed(reportContainer, embedConfig);
      report.off('error');
      report.on('error', (error) => {
        this.alertService.danger('Failed to embed report.');
      });
  }
  // Load the report based on workspace selected
  // sets the report ID and token
  private async loadReport(config: ConfigType): Promise<any> {
    if (config.report == null || config.workspace == null) {
      throw Error('Report or Workspace not set')
    }
    this.workspaceID = config.workspace;
    this.reportID = config.report?.id;
    this.reportName = config.report?.name;
    const token = await this.getToken(this.reportID, this.workspaceID, this.reportName);
    if (token) {
      this.embeddingInfo = {
        reportId: this.reportID,
        embeddingToken: token
      };
    }
    // cache set the token
  }
  // Fetch the token for selected report and workspace
  private async getToken(reportId: string, workspaceId: string, reportName: string): Promise<string | undefined> {
    try {
      const token = await this.powerbiService.embedReport(workspaceId, reportId);
      this.embeddedReport = token;
      this.reportToDisplay = {
        id: reportId,
        workspaceId,
        token: token,
        name: reportName
      };
      return token;
    } catch (e) {
      this.alertService.danger('An error occurred while fetching the embedding token for the report.');
    }
    return undefined;
  }
}
