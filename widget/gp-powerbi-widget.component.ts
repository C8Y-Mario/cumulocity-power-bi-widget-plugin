/**
 * Copyright (c) 2021 Software AG, Darmstadt, Germany and/or its licensors
 *
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
import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { AlertService, gettext } from '@c8y/ngx-components';
import * as pbiClient from 'powerbi-client';
import { HttpService } from './http.service';
import { EmbeddingInfo, PowerBIWorkspace } from './powerbi.interface';
import { PowerBIService } from './powerbi.service';
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
  @ViewChild('reportContainer', { static: true }) reportContainer: ElementRef;
  embeddingInfo: EmbeddingInfo;
  reportName: string;
  workspaceID;
  reportID;
  @Input() config;
  public workspaces: PowerBIWorkspace[] = [];
  public settingsNotDefined = false;
  public isLoading = false;
  embedUrl = 'https://app.powerbi.com/reportEmbed';
  embeddedReport: any;
  reportToDisplay: { id: string; workspaceId: string; token: any; name: any; };
  constructor(
    private powerbiService: PowerBIService,
    private alertService: AlertService,
    private http: HttpService,
  ) {
  }
  // When changes are pushed from host component to report component, component is reinitialized to show a different report.
  // This may not be needed in customer scenario
  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes.embeddingInfo && changes.embeddingInfo.currentValue) {
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
      // tslint:disable-next-line:max-line-length
      this.embedReport(this.embeddingInfo.reportId, this.embeddingInfo.embeddingToken, this.config.isFilterPaneEnabled, this.config.isNavPaneEnabled);
    } catch (e) {
      this.alertService.danger('Failed to fetch embedding token.');
    }
  }
  // This is where the Power BI client is actually used - parametrize the config however you like
  private embedReport(reportId: any, token: string, filterPanelEnabled: boolean, navPanelEnabled?: boolean): any {
    const embedConfig = {
      type: 'report',
      id: reportId,
      embedUrl: this.embedUrl,
      tokenType: pbiClient.models.TokenType.Embed,
      accessToken: token,
      // permissions: pbi.models.Permissions.Read,
      settings: {
        // The option is called filterPaneEnabled, there is a typo in the method parameter name
        filterPaneEnabled: filterPanelEnabled,
        // Same as filterPaneEnabled
        navContentPaneEnabled: navPanelEnabled,
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
  // Load the report based on worspace selected
  // sets the report ID and token
  private async loadReport(config): Promise<any> {
    this.workspaceID = this.config.workspaceSelected.id;
    this.reportID = this.config.reportSelected.id;
    this.reportName = this.config.reportSelected.name;
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
  private async getToken(reportId: string, workspaceId: string, reportName): Promise<string> {
    try {
      const tokenRequest = await this.powerbiService.embedReport(this.workspaceID, this.reportID);
      if (tokenRequest.status === 200) {
        const payload = await tokenRequest.json();
        if (payload.status === 'SUCCEEDED') {
          this.embeddedReport = payload.data;
          this.reportToDisplay = {
            id: reportId,
            workspaceId,
            token: this.embeddedReport.token,
            name: reportName
          };
          return this.embeddedReport.token;
        } else {
          this.alertService.danger('Error in payload');
          throw Error();
        }
      } else {
        this.alertService.danger('Error in tokenRequest');
        throw Error();
      }
    } catch (e) {
      this.alertService.danger('An error occurred while fetching the embedding token for the report.');
    }
  }
}
