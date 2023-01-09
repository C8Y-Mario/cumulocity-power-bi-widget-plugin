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
import { Component, Input, isDevMode, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertService, gettext } from '@c8y/ngx-components';
import { Subject } from 'rxjs';
import { HttpService } from '../http.service';
import { PowerBIReportModalResult, PowerBIReports, PowerBIWorkspace } from '../powerbi.interface';
import { PowerBIService } from '../powerbi.service';
@Component({
  selector: 'gp-powerbi-config',
  templateUrl: './gp-powerbi-config.component.html',
  styleUrls: ['./gp-powerbi-config.component.css']
})
export class GpPowerbiConfigComponent implements OnInit {
  @Input() config: any = {
    powerBIEndPoint: '',
    datahubEndPoint: '',
    embedEndPoint: ''
  };
  public isFilterPaneEnabled = false;
  public isNavPaneEnabled = false;
  public workspaceIndex = 0;
  public workspaces: PowerBIWorkspace[];
  public reports: PowerBIReports[];
  public visibleReports: PowerBIReports;
  public form: FormGroup;
  public isLoading = false;
  public onClose: Subject<PowerBIReportModalResult> = new Subject<PowerBIReportModalResult>();
  public modalResult: PowerBIReportModalResult = {
    workspaceId: null,
    report: null
  };
  public error = '';
  constructor(
    private powerbiService: PowerBIService,
    private fb: FormBuilder,
    private alertService: AlertService,
    private http: HttpService
  ) {
    this.form = this.fb.group({
      workspace: this.fb.control(null, Validators.required),
      report: this.fb.control(null, Validators.required)
    });
  }
  async ngOnInit(): Promise<void> {
    if (!this.config.isNavPaneEnabled) {
      this.config.isNavPaneEnabled = false;
    }
    if (this.config.powerBIEndPoint === '' || this.config.powerBIEndPoint === undefined) {
      this.config.powerBIEndPoint = '/powerbi';
    } else {
      if (isDevMode()) { console.log(this.config.powerBIEndPoint); }
    }
    if (this.config.datahubEndPoint === '' || this.config.datahubEndPoint === undefined) {
      this.config.datahubEndPoint = '/service/datahub';
    } else {
      if (isDevMode()) { console.log(this.config.datahubEndPoint); }
    }
    if (this.config.embedEndPoint === '' || this.config.embedEndPoint === undefined) {
      this.config.embedEndPoint = 'https://app.powerbi.com/reportEmbed';
    } else {
      if (isDevMode()) { console.log(this.config.embedEndPoint); }
    }
    if (this.config.datahubEndPoint !== '/service/datahub' || this.config.powerBIEndPoint !== '/powerbi') {
      this.setUrlAndGetWorkspace();
    } else {
      this.http.path = this.config.datahubEndPoint;
      this.powerbiService.path = this.config.powerBIEndPoint;
      this.getReport();
    }
  }
  // If user updates datahub or PowerBI url
  // then use that and update the path in http service and powerbi service
  // and fetch list of workspaces and reports available if any
  setUrlAndGetWorkspace(): any {
    if (isDevMode()) {
      console.log('setUrlAndGetWorkspace Config URL', this.config.powerBIEndPoint, this.config, this.config.datahubEndPoint);
    }
    this.http.path = this.config.datahubEndPoint;
    this.powerbiService.path = this.config.powerBIEndPoint;
    this.getReport();
  }
  // fetch the exisiting selected value of workspace and report if available
  // and list of workspaces and reports available if any
  async getReport(): Promise<any> {
    const configFetchResponse = await this.powerbiService.getConfig();
    if (configFetchResponse.status === 200) {
      const config = await configFetchResponse.json();
    } else {
      this.alertService.danger('Cannot find the Path');
    }
    const workspacesFetchResult = await this.powerbiService.listWorkspaces();
    if (workspacesFetchResult.status === 200) {
      const reports = await workspacesFetchResult.json();
      // If reports are found
      if (reports.status === 'SUCCEEDED') {
        this.workspaces = reports.data;
        // If workspace length is zero then show error message
        if (this.workspaces.length === 0) {
          this.alertService.danger('Cannot select report because no workspaces are available.');
        } else {
          const selectedWorkspaceIndex = this.extractWorkspaceIndex();
          await this.fetchReportsForFirstWorkspaceAndShow(selectedWorkspaceIndex);
          this.initForm();
        }
      } // If reports are not found reports.status != 'SUCCEEDED'
      else {
      } // End of reports.staus check
    }
  }
  extractWorkspaceIndex(): number {
    if (this.config.workspaceSelected !== undefined) {
      const workspaceIndex = this.workspaces.findIndex((workspace) =>
        workspace.id === this.config.workspaceSelected.id
      );
      return workspaceIndex;
    } else {
      return 0;
    }
  }
  extractReportIndex(): number {
    if (this.config.reportSelected !== undefined) {
      const reportIndex = this.reports[0].findIndex((report, index) => {
        if (report.id === this.config.reportSelected.id) {
          return 1;
        } else {
          if (isDevMode()) { console.log('no matching in reports'); }
        }
      });
      return reportIndex;
    } else {
      return 0;
    }
  }
  // Show the selected value in form and update the values selected in config
  // workspace and report
  initForm(): any {
    const selectedWorkspaceIndex = this.extractWorkspaceIndex();
    const selectedReportIndex = this.extractReportIndex();
    if (selectedWorkspaceIndex) {
      this.form = this.fb.group({
        workspace: this.fb.control(this.workspaces[selectedWorkspaceIndex], Validators.required),
        report: this.fb.control(this.reports[0].length > 0 ? this.reports[0][selectedReportIndex] : null, Validators.required)
      });
    } else {
      this.form = this.fb.group({
        workspace: this.fb.control(this.workspaces[0], Validators.required),
        report: this.fb.control(this.reports[0].length > 0 ? this.reports[0][0] : null, Validators.required)
      });
    }
    this.visibleReports = this.reports[0];
    const workspaces = this.workspaces.slice(1, this.workspaces.length);
    workspaces.forEach(() => {
      this.reports.push(null);
    });
    this.config.reportSelected = this.form.controls.report.value;
    this.config.workspaceSelected = this.form.controls.workspace.value;
    this.form.controls.workspace.valueChanges.subscribe(async (workspaceValue: PowerBIWorkspace) => {
      const workspaceIndex = this.workspaces.findIndex((workspace) => workspace === workspaceValue);
      if (workspaceIndex >= 0) {
        if (this.reports[workspaceIndex] === null) {
          try {
            this.error = '';
            this.isLoading = true;
            const reportsFetchResult = await this.powerbiService.listReports(this.workspaces[workspaceIndex].id);
            if (reportsFetchResult.status === 200) {
              const payload = await reportsFetchResult.json();
              if (payload.status === 'SUCCEEDED') {
                this.reports[workspaceIndex] = payload.data;
                if (this.reports[workspaceIndex].length > 0) {
                  this.form.controls.workspace.setValue(this.workspaces[workspaceIndex]);
                  this.form.controls.report.setValue(this.reports[workspaceIndex][0]);
                } else {
                  this.form.controls.report.setValue(null);
                }
                this.form.updateValueAndValidity();
              } else {
                throw Error();
              }
            } else {
              this.form.controls.report.setValue(null);
              throw Error();
            }
          } catch (e) {
            this.error = 'Fetching reports for workspace failed.';
          } finally {
            this.isLoading = false;
          }
        } else {
          try {
            this.error = '';
            this.isLoading = true;
            const reportsFetchResult = await this.powerbiService.listReports(this.workspaces[workspaceIndex].id);
            if (reportsFetchResult.status === 200) {
              const payload = await reportsFetchResult.json();
              if (payload.status === 'SUCCEEDED') {
                this.reports[workspaceIndex] = payload.data;
                if (this.reports[workspaceIndex].length > 0) {
                  this.form.controls.report.setValue(this.reports[workspaceIndex][0]);
                } else {
                  this.form.controls.report.setValue(null);
                }
                this.form.updateValueAndValidity();
              } else {
                throw Error();
              }
            } else {
              this.form.controls.report.setValue(null);
              throw Error();
            }
          } catch (e) {
            this.error = 'Fetching reports for workspace failed.';
          } finally {
            this.isLoading = false;
          }
          this.error = '';
        }
        this.visibleReports = this.reports[workspaceIndex];
        this.workspaceIndex = workspaceIndex;
        this.config.workspaceSelected = this.form.controls.workspace.value;
      }
    });
    // Form change on report selection
    this.form.controls.report.valueChanges.subscribe(async (reportValue: PowerBIReports) => {
      const reportIndex = this.reports.findIndex((report) => report === reportValue);
      this.config.reportSelected = reportValue;
    });
  }
  // Fetch the Reports for Workspace and show those
  private async fetchReportsForFirstWorkspaceAndShow(configWorkspaceIndex): Promise<any> {
    try {
      // If workspace are available, then fetch reports and populate dropdown
      let reportsFetchResult;
      if (configWorkspaceIndex) {
        reportsFetchResult = await this.powerbiService.listReports(this.workspaces[configWorkspaceIndex].id);
      } else {
        reportsFetchResult = await this.powerbiService.listReports(this.workspaces[0].id);
      }
      if (reportsFetchResult.status === 200) {
        const payload = await reportsFetchResult.json();
        // If there is data in response
        if (payload.status === 'SUCCEEDED') {
          // Add data to reports array
          this.reports = [];
          this.reports.push(payload.data);
          // Cretae initial state of workspace and report
          const initialState = {
            workspaces: this.workspaces,
            reports: this.reports
          };
        } else {
          throw Error();
        }
      } else {
        throw Error();
      }
    }
    catch {
      const msg = gettext('An error occurred while fetching reports of workspace {{workspaceName}}. Try again.');
      this.alertService.danger('workspaceName: ', this.workspaces[0].name);
    }
  }
}
